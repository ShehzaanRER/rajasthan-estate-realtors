/**
 * Listings against a REAL PostgreSQL — the real Payload Local API, the real
 * collections, hooks, access rules and public data layer.
 *
 * Skipped unless RER_LISTINGS_TEST_DATABASE_URL is set, and refuses to run
 * unless that URL is a local database whose name contains "test". It creates
 * its own records (all titled "ITEST …") and deletes them afterwards; it never
 * resets, truncates or reseeds anything, and it uses a throw-away database so
 * the schema push that Payload runs on boot cannot touch real data.
 *
 *   RER_LISTINGS_TEST_DATABASE_URL=postgresql://user:pw@127.0.0.1:5432/rer_itest npm test
 *
 * One Payload boot serves the whole file, so the order of the tests below is
 * the story of one property's life.
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

const TEST_DB = process.env.RER_LISTINGS_TEST_DATABASE_URL;

function assertSafeTestDatabase(url: string) {
  const parsed = new URL(url);
  const local = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsed.hostname);
  const name = parsed.pathname.replace(/^\//, '');
  assert.ok(local, `RER_LISTINGS_TEST_DATABASE_URL must point at a local database, not ${parsed.hostname}`);
  assert.match(name, /test/i, `database name "${name}" must contain "test"`);
}

describe('listings against a real database', { skip: !TEST_DB }, () => {
  // Typed loosely on purpose: the app config is imported dynamically, after the
  // environment points it at the test database.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let payload: any;
  let lib: any;
  let staff: any;
  const created = { properties: [] as number[], listings: [] as number[], users: [] as number[] };

  const baseProperty = (overrides: Record<string, unknown> = {}) => ({
    title: 'ITEST United Tower 2 BHK',
    propertyType: 'apartment',
    propertyCategory: 'residential',
    location: { locality: 'Andheri West', city: 'Mumbai' },
    details: { bedrooms: 2, carpetArea: 780, carpetAreaUnit: 'sq-ft' },
    buildingDetails: { buildingName: 'United Tower' },
    ...overrides,
  });

  const makeProperty = async (overrides: Record<string, unknown> = {}) => {
    const doc = await payload.create({ collection: 'properties', data: baseProperty(overrides), overrideAccess: true });
    created.properties.push(doc.id);
    return doc;
  };

  const makeListing = async (data: Record<string, unknown>) => {
    const doc = await payload.create({ collection: 'listings', data, overrideAccess: true, user: staff });
    created.listings.push(doc.id);
    return doc;
  };

  const fresh = (id: number) => payload.findByID({ collection: 'properties', id, depth: 0, overrideAccess: true });
  const listingsOf = async (propertyId: number) =>
    (await payload.find({ collection: 'listings', where: { property: { equals: propertyId } }, depth: 0, pagination: false, overrideAccess: true })).docs;

  const messageOf = async (promise: Promise<unknown>) => {
    try {
      await promise;
      return '';
    } catch (error) {
      const data = (error as { data?: { errors?: Array<{ message: string }> } }).data;
      return [(error as Error).message, ...(data?.errors ?? []).map((e) => e.message)].join(' | ');
    }
  };

  before(async () => {
    assertSafeTestDatabase(TEST_DB as string);
    process.env.DATABASE_URL = TEST_DB;
    process.env.PAYLOAD_SECRET ||= 'itest-secret-not-for-production';
    process.env.NEXT_PUBLIC_SITE_URL ||= 'http://localhost:3000';

    const { getPayloadClient } = await import('../lib/payload');
    payload = await getPayloadClient();
    lib = {
      getProperties: (await import('../lib/properties/getProperties')).getProperties,
      getPropertyLocalities: (await import('../lib/properties/getProperties')).getPropertyLocalities,
      getFeaturedProperties: (await import('../lib/properties/getFeaturedProperties')).getFeaturedProperties,
      getSimilarProperties: (await import('../lib/properties/getSimilarProperties')).getSimilarProperties,
      getPropertyBySlug: (await import('../lib/properties/getPropertyBySlug')).getPropertyBySlug,
      resolvePropertySlugToListing: (await import('../lib/properties/getPropertyBySlug')).resolvePropertySlugToListing,
      getPropertySitemapEntries: (await import('../lib/properties/getSitemapEntries')).getPropertySitemapEntries,
      createListingForLegacyProperty: (await import('../lib/listings/createFromLegacy')).createListingForLegacyProperty,
    };

    staff = await payload.create({
      collection: 'users',
      data: { email: `itest-${Date.now()}@example.test`, password: 'itest-password-1', name: 'ITEST staff' },
      overrideAccess: true,
    });
    created.users.push(staff.id);
  });

  after(async () => {
    if (!payload) return;
    for (const id of created.listings.reverse()) {
      await payload.delete({ collection: 'listings', id, overrideAccess: true }).catch(() => undefined);
    }
    for (const id of created.properties.reverse()) {
      await payload.delete({ collection: 'properties', id, overrideAccess: true }).catch(() => undefined);
    }
    for (const id of created.users) {
      await payload.delete({ collection: 'users', id, overrideAccess: true }).catch(() => undefined);
    }
  });

  let tower: any;
  let sale: any;
  let rent: any;

  it('1. creates a property with a sale listing: separate IDs, inherited slug, rolled-up status', async () => {
    tower = await makeProperty();
    assert.match(tower.propertyId, /^RER-\d{5}$/);
    assert.equal(tower.status, 'draft', 'a property with no listing is not live');

    sale = await makeListing({ property: tower.id, transactionType: 'sale', status: 'available', pricing: { price: 22_500_000 } });

    assert.match(sale.listingId, /^RER-L-\d{5}$/);
    assert.notEqual(sale.listingId, tower.propertyId);
    assert.equal(sale.slug, tower.slug, 'the first listing keeps the property URL');
    assert.equal((await fresh(tower.id)).status, 'available');
  });

  it('3. adds a rental to a property that already has a sale listing', async () => {
    rent = await makeListing({
      property: tower.id,
      transactionType: 'rent',
      status: 'available',
      pricing: { rentAmount: 75_000, securityDeposit: 300_000 },
    });

    assert.equal(rent.slug, `${tower.slug}-rent`);
    assert.notEqual(rent.listingId, sale.listingId);
    assert.equal((await listingsOf(tower.id)).length, 2);
    assert.equal(
      (await payload.count({ collection: 'properties', where: { id: { equals: tower.id } }, overrideAccess: true })).totalDocs,
      1,
      'still one physical property',
    );
  });

  it('prevents a second active listing of the same transaction type', async () => {
    const message = await messageOf(
      payload.create({
        collection: 'listings',
        data: { property: tower.id, transactionType: 'rent', status: 'draft' },
        overrideAccess: true,
      }),
    );
    assert.match(message, /already has an active Rent listing/);
    assert.equal((await listingsOf(tower.id)).length, 2);
  });

  it('rejects a listing for a property that does not exist', async () => {
    const message = await messageOf(
      payload.create({
        collection: 'listings',
        data: { property: 99_999_999, transactionType: 'sale', status: 'draft' },
        overrideAccess: true,
      }),
    );
    assert.ok(message.length > 0, 'the create must fail');
  });

  it('rejects re-parenting a listing', async () => {
    const other = await makeProperty({ title: 'ITEST Other Flat' });
    const message = await messageOf(
      payload.update({ collection: 'listings', id: sale.id, data: { property: other.id }, overrideAccess: true }),
    );
    assert.match(message, /cannot be moved/);
  });

  it('5. edits one listing\'s price and status without touching the other', async () => {
    const rentBefore = await payload.findByID({ collection: 'listings', id: rent.id, depth: 0, overrideAccess: true });

    await payload.update({
      collection: 'listings',
      id: sale.id,
      data: { pricing: { price: 21_000_000 }, status: 'under-offer' },
      overrideAccess: true,
    });

    const saleAfter = await payload.findByID({ collection: 'listings', id: sale.id, depth: 0, overrideAccess: true });
    const rentAfter = await payload.findByID({ collection: 'listings', id: rent.id, depth: 0, overrideAccess: true });
    assert.equal(saleAfter.pricing.price, 21_000_000);
    assert.equal(saleAfter.status, 'under-offer');
    assert.equal(rentAfter.status, 'available');
    assert.equal(rentAfter.pricing.rentAmount, 75_000);
    assert.equal(rentAfter.updatedAt, rentBefore.updatedAt, 'the other listing was not even written');
  });

  it('7/8. sale and rent searches return the right listing; the property is never shown twice', async () => {
    const buy = (await lib.getProperties({ purpose: 'sale' })).filter((p: any) => p.propertyId === tower.propertyId);
    const rental = (await lib.getProperties({ purpose: 'rent' })).filter((p: any) => p.propertyId === tower.propertyId);
    const all = (await lib.getProperties({})).filter((p: any) => p.propertyId === tower.propertyId);

    assert.equal(buy.length, 1);
    assert.equal(buy[0].purpose, 'sale');
    assert.equal(buy[0].pricing.displayPrice, '₹2.1 Cr');

    assert.equal(rental.length, 1);
    assert.equal(rental[0].purpose, 'rent');
    assert.equal(rental[0].pricing.displayPrice, '₹75,000 / month');
    assert.equal(rental[0].pricing.securityDeposit, 300_000);

    assert.equal(all.length, 1, 'one card for the property in an unfiltered search');
    assert.equal(all[0].purpose, 'sale');
    assert.deepEqual(all[0].otherListings.map((l: any) => l.purpose), ['rent']);
  });

  it('budget filters apply to the right price field per transaction type', async () => {
    const cheap = await lib.getProperties({ purpose: 'rent', maxPrice: 50_000 });
    const fits = await lib.getProperties({ purpose: 'rent', minPrice: 50_000, maxPrice: 100_000 });
    assert.ok(!cheap.some((p: any) => p.propertyId === tower.propertyId));
    assert.ok(fits.some((p: any) => p.propertyId === tower.propertyId));

    const sold = await lib.getProperties({ purpose: 'sale', maxPrice: 10_000_000 });
    assert.ok(!sold.some((p: any) => p.propertyId === tower.propertyId));
  });

  it('opening a listing shows its own transaction and the shared property', async () => {
    const forSale = await lib.getPropertyBySlug(sale.slug);
    const forRent = await lib.getPropertyBySlug(rent.slug);

    assert.equal(forSale.listingId, sale.listingId);
    assert.equal(forRent.listingId, rent.listingId);
    assert.equal(forSale.propertyId, forRent.propertyId);
    assert.equal(forSale.title, forRent.title);
    assert.deepEqual(forSale.location, forRent.location);
    assert.equal(forSale.pricing.displayPrice, '₹2.1 Cr');
    assert.equal(forRent.pricing.displayPrice, '₹75,000 / month');
    assert.deepEqual(forRent.otherListings.map((l: any) => l.listingId), [sale.listingId]);
  });

  it('locality options count distinct properties, not listings', async () => {
    const options = await lib.getPropertyLocalities({});
    const andheri = options.find((o: any) => o.label === 'Andheri West');
    const cards = (await lib.getProperties({})).filter((p: any) => p.location.locality === 'Andheri West');
    assert.ok(andheri);
    assert.equal(andheri.count, cards.length, 'the dual-listed tower counts once');
  });

  it('featured is per listing: featuring the rental does not feature the sale', async () => {
    await payload.update({ collection: 'listings', id: rent.id, data: { tags: ['featured'] }, overrideAccess: true });
    const featured = (await lib.getFeaturedProperties({})).filter((p: any) => p.propertyId === tower.propertyId);
    assert.equal(featured.length, 1);
    assert.equal(featured[0].purpose, 'rent', 'the featured card is the rental listing');
    assert.equal((await lib.getPropertyBySlug(sale.slug)).featured, false);
    assert.equal((await lib.getPropertyBySlug(rent.slug)).featured, true);
    await payload.update({ collection: 'listings', id: rent.id, data: { tags: [] }, overrideAccess: true });
  });

  it('the sitemap lists each public listing once, with its own URL', async () => {
    const slugs = (await lib.getPropertySitemapEntries()).map((e: any) => e.slug);
    assert.equal(slugs.filter((s: string) => s === sale.slug).length, 1);
    assert.equal(slugs.filter((s: string) => s === rent.slug).length, 1);
  });

  it('the property\'s own slug resolves to its leading public listing', async () => {
    await payload.update({ collection: 'properties', id: tower.id, data: { slug: `${tower.slug}-moved` }, overrideAccess: true });
    assert.equal(await lib.resolvePropertySlugToListing(`${tower.slug}-moved`), sale.slug, 'sale outranks rent');
    assert.equal(await lib.resolvePropertySlugToListing('no-such-slug'), null);
  });

  it('9. anonymous visitors see live listings and properties only', async () => {
    const anonymousListings = await payload.find({
      collection: 'listings',
      where: { property: { equals: tower.id } },
      depth: 0,
      overrideAccess: false,
    });
    assert.equal(anonymousListings.docs.length, 2);
    for (const doc of anonymousListings.docs) {
      assert.equal(doc.internalNotes, undefined, 'staff-only fields are stripped');
    }

    const draft = await makeProperty({ title: 'ITEST Draft Flat' });
    const draftListing = await makeListing({ property: draft.id, transactionType: 'sale', status: 'draft' });
    const visible = await payload.find({ collection: 'listings', where: { id: { equals: draftListing.id } }, overrideAccess: false });
    assert.equal(visible.docs.length, 0, 'a draft listing is invisible to visitors');
    const visibleProperty = await payload.find({ collection: 'properties', where: { id: { equals: draft.id } }, overrideAccess: false });
    assert.equal(visibleProperty.docs.length, 0, 'and so is its property');

    assert.ok(await messageOf(payload.create({ collection: 'listings', data: { property: tower.id, transactionType: 'lease', status: 'draft' }, overrideAccess: false })));
  });

  it('6a. closing the rental keeps the sale active', async () => {
    await payload.update({ collection: 'properties', id: tower.id, data: { rentHistory: [{ licenseeName: 'ITEST Tenant' }] }, overrideAccess: true });
    await payload.update({ collection: 'listings', id: rent.id, data: { status: 'rented' }, overrideAccess: true });

    const property = await fresh(tower.id);
    assert.equal((await payload.findByID({ collection: 'listings', id: sale.id, depth: 0, overrideAccess: true })).status, 'under-offer');
    assert.equal(property.status, 'under-offer', 'the sale still keeps the property live');
    assert.equal(property.isTenanted, true);

    const rentals = await lib.getProperties({ purpose: 'rent' });
    assert.ok(!rentals.some((p: any) => p.propertyId === tower.propertyId), 'a rented listing leaves rental search');
    const buys = await lib.getProperties({ purpose: 'sale' });
    assert.ok(buys.some((p: any) => p.propertyId === tower.propertyId), 'the sale is still searchable');
    assert.equal(await lib.getPropertyBySlug(rent.slug), null, 'the closed listing page is gone');
  });

  it('6b. closing the sale as well takes the property off the website', async () => {
    await payload.update({ collection: 'listings', id: sale.id, data: { status: 'sold' }, overrideAccess: true });
    assert.equal((await fresh(tower.id)).status, 'rented');
    assert.equal(await lib.getPropertyBySlug(sale.slug), null);
    assert.equal(await lib.resolvePropertySlugToListing(sale.slug), null, 'a closed listing URL is a 404, never redirected to a sibling');
  });

  it('a closed listing can be followed by a new one of the same type', async () => {
    const again = await makeListing({ property: tower.id, transactionType: 'sale', status: 'available', pricing: { price: 19_000_000 } });
    // The property's slug was rebuilt earlier (`-moved`), and no listing uses
    // that slug yet, so the new listing takes it; the sold one keeps its own URL.
    assert.equal(again.slug, `${tower.slug}-moved`);
    assert.notEqual(again.slug, sale.slug);
    assert.equal((await fresh(tower.id)).status, 'available');
  });

  it('a rental cannot be marked Rented before a tenancy is recorded', async () => {
    const flat = await makeProperty({ title: 'ITEST No Tenancy Flat' });
    const listing = await makeListing({ property: flat.id, transactionType: 'rent', status: 'available', pricing: { rentAmount: 30_000 } });
    const message = await messageOf(
      payload.update({ collection: 'listings', id: listing.id, data: { status: 'rented' }, overrideAccess: true }),
    );
    assert.match(message, /Tenancy History/);
  });

  it('deleting a listing leaves the property and its other listings; a property with listings cannot be deleted', async () => {
    const flat = await makeProperty({ title: 'ITEST Delete Flat' });
    const a = await makeListing({ property: flat.id, transactionType: 'sale', status: 'available', pricing: { price: 1_000_000 } });
    const b = await makeListing({ property: flat.id, transactionType: 'rent', status: 'available', pricing: { rentAmount: 10_000 } });

    assert.match(await messageOf(payload.delete({ collection: 'properties', id: flat.id, overrideAccess: true })), /still has 2 listing/);

    await payload.delete({ collection: 'listings', id: a.id, overrideAccess: true });
    created.listings = created.listings.filter((id) => id !== a.id);

    assert.ok(await fresh(flat.id), 'property survives');
    assert.equal((await listingsOf(flat.id)).map((l: any) => l.id).join(), String(b.id), 'the other listing survives');
    assert.equal((await fresh(flat.id)).status, 'available', 'rental keeps the property live');
  });

  it('only one status vocabulary is editable: the property\'s own status ignores direct edits', async () => {
    const flat = await makeProperty({ title: 'ITEST Status Flat' });
    const updated = await payload.update({
      collection: 'properties',
      id: flat.id,
      data: { status: 'available' },
      overrideAccess: false,
      user: staff,
    });
    assert.equal(updated.status, 'draft', 'a user cannot publish a property by editing its summary status');
  });

  it('10-12. a legacy single-record property gets exactly one listing, once, with its data intact', async () => {
    const legacy = await makeProperty({
      title: 'ITEST Legacy Rental',
      purpose: 'rent',
      status: 'available',
      tags: ['featured', 'ready-to-move'],
      pricing: { rentAmount: 40_000, securityDeposit: 150_000, maintenanceCharges: 2_500 },
    });
    const before = await fresh(legacy.id);

    const first = await lib.createListingForLegacyProperty(payload, before);
    const second = await lib.createListingForLegacyProperty(payload, before);
    created.listings.push(...(await listingsOf(legacy.id)).map((l: any) => l.id));

    assert.ok(first.listingId);
    assert.equal(second.listingId, null, 'the rerun creates nothing');
    const listings = await listingsOf(legacy.id);
    assert.equal(listings.length, 1);
    assert.equal(listings[0].slug, before.slug, 'public URL preserved');
    assert.deepEqual(
      { rent: listings[0].pricing.rentAmount, deposit: listings[0].pricing.securityDeposit, maintenance: listings[0].pricing.maintenanceCharges },
      { rent: 40_000, deposit: 150_000, maintenance: 2_500 },
    );
    assert.deepEqual([...listings[0].tags].sort(), ['featured']);

    const after = await fresh(legacy.id);
    assert.equal(after.propertyId, before.propertyId, 'property ID untouched');
    assert.equal(after.slug, before.slug);
    assert.equal(after.purpose, 'rent', 'legacy fields remain on the property');
    assert.equal(after.pricing.rentAmount, 40_000);
    assert.deepEqual([...after.tags].sort(), ['featured', 'ready-to-move']);
  });

  it('12. creating listings never advances the property ID sequence', async () => {
    // Listings draw from their own sequence, so the property series stays
    // gapless: a property created after listings is simply the next ID.
    const before = await makeProperty({ title: 'ITEST Sequence A' });
    await makeListing({ property: before.id, transactionType: 'sale', status: 'draft' });
    const next = await makeProperty({ title: 'ITEST Sequence B' });
    assert.equal(Number(next.propertyId.replace(/\D/g, '')), Number(before.propertyId.replace(/\D/g, '')) + 1);
  });

  // --- hardening -------------------------------------------------------------------

  const exec = async (query: string) => {
    const { sql } = await import('@payloadcms/db-postgres');
    const result = await payload.db.drizzle.execute(sql.raw(query));
    return (Array.isArray(result) ? result : result.rows) as Record<string, unknown>[];
  };
  const sequenceValue = async (name: string) => Number((await exec(`SELECT last_value FROM ${name}`))[0].last_value);
  const constraintOf = (error: unknown): string => {
    let current = error as { constraint?: string; cause?: unknown; message?: string } | undefined;
    for (let depth = 0; depth < 5 && current; depth += 1) {
      if (current.constraint) return current.constraint;
      current = current.cause as typeof current;
    }
    return String((error as Error)?.message ?? error);
  };

  it('the database itself rejects a second ACTIVE listing of a type, even bypassing every hook', async () => {
    const flat = await makeProperty({ title: 'ITEST Index Flat' });
    await makeListing({ property: flat.id, transactionType: 'sale', status: 'draft' });
    const insert = (status: string, slug: string, type = 'sale') =>
      exec(
        `INSERT INTO listings (listing_id, status, property_id, transaction_type, slug, updated_at, created_at)
         VALUES ('ITEST-${slug}', '${status}', ${flat.id}, '${type}', 'itest-${slug}', now(), now())`,
      );

    for (const status of ['draft', 'available', 'under-offer']) {
      await assert.rejects(insert(status, `dup-${status}`), (error) => constraintOf(error).includes('listings_one_active_per_type_idx'), status);
    }

    // History is never constrained: sold / rented / withdrawn rows coexist with the active one.
    await insert('sold', 'old-sold');
    await insert('withdrawn', 'old-withdrawn');
    await insert('withdrawn', 'old-withdrawn-2');
    // A different transaction type is independent.
    await insert('available', 'rent-alongside', 'rent');
    await exec(`DELETE FROM listings WHERE listing_id LIKE 'ITEST-%'`);
  });

  it('concurrent saves of the same type: exactly one wins, Sale and Rent coexist', async () => {
    const flat = await makeProperty({ title: 'ITEST Race Flat' });
    const attempt = (transactionType: string) =>
      payload.create({ collection: 'listings', data: { property: flat.id, transactionType, status: 'draft' }, overrideAccess: true });

    const results = await Promise.allSettled([attempt('rent'), attempt('rent'), attempt('rent'), attempt('sale')]);
    for (const result of results) {
      if (result.status === 'fulfilled') created.listings.push(result.value.id);
    }

    const rents = results.slice(0, 3);
    assert.equal(rents.filter((r) => r.status === 'fulfilled').length, 1, 'one rental wins');
    for (const rejected of rents.filter((r): r is PromiseRejectedResult => r.status === 'rejected')) {
      const errors = (rejected.reason as { data?: { errors?: Array<{ path?: string; message?: string }> } }).data?.errors ?? [];
      // Either the hook saw the winner first, or the race reached the index;
      // both surface as a validation error on Transaction type.
      assert.ok(errors.some((e) => e.path === 'transactionType'), JSON.stringify(errors));
      console.log(`      race loser rejected by: ${/unique/i.test(errors[0]?.message ?? '') ? 'database index' : 'validateListing hook'}`);
    }
    assert.equal(results[3].status, 'fulfilled', 'the sale listing is independent of the rentals');

    const active = (await listingsOf(flat.id)).map((l: any) => l.transactionType).sort();
    assert.deepEqual(active, ['rent', 'sale']);
  });

  it('concurrent FIRST Sale and Rent listings on a new property both succeed with distinct URLs', async () => {
    // Both would otherwise claim the property's bare slug at the same instant;
    // the per-property advisory lock (listingLock.ts) serialises them.
    const flat = await makeProperty({ title: 'ITEST Twin Flat' });
    const [saleResult, rentResult] = await Promise.allSettled([
      payload.create({ collection: 'listings', data: { property: flat.id, transactionType: 'sale', status: 'draft' }, overrideAccess: true }),
      payload.create({ collection: 'listings', data: { property: flat.id, transactionType: 'rent', status: 'draft' }, overrideAccess: true }),
    ]);
    for (const result of [saleResult, rentResult]) {
      if (result.status === 'fulfilled') created.listings.push(result.value.id);
    }
    assert.equal(saleResult.status, 'fulfilled', String((saleResult as PromiseRejectedResult).reason));
    assert.equal(rentResult.status, 'fulfilled', String((rentResult as PromiseRejectedResult).reason));
    const slugs = (await listingsOf(flat.id)).map((l: any) => l.slug).sort();
    assert.equal(new Set(slugs).size, 2);
    assert.ok(slugs.includes(flat.slug), 'one of them took the property URL');
  });

  it('2. creates a property and its first Sale listing in one save, and adds the Rent listing later', async () => {
    const property = await payload.create({
      collection: 'properties',
      data: {
        ...baseProperty({ title: 'ITEST One-step Flat' }),
        initialListing: { transactionType: 'sale', status: 'available', price: 12_000_000, rentAmount: 1, negotiable: true },
      },
      overrideAccess: false,
      user: staff,
    });
    created.properties.push(property.id);
    const listings = await listingsOf(property.id);
    created.listings.push(...listings.map((l: any) => l.id));

    assert.equal(listings.length, 1);
    assert.equal(listings[0].transactionType, 'sale');
    assert.equal(listings[0].status, 'available');
    assert.equal(listings[0].pricing.price, 12_000_000);
    assert.equal(listings[0].pricing.rentAmount, null, 'fields of the other type are not carried');
    assert.equal(listings[0].pricing.negotiable, true);
    assert.equal(listings[0].slug, property.slug, 'first listing takes the property URL');
    assert.equal((await fresh(property.id)).status, 'available');
    const stored = await exec("SELECT column_name FROM information_schema.columns WHERE table_name = 'properties' AND column_name LIKE 'initial%'");
    assert.equal(stored.length, 0, 'the form group has no column: it is never stored');

    const rental = await makeListing({ property: property.id, transactionType: 'rent', status: 'available', pricing: { rentAmount: 60_000 } });
    assert.equal(rental.slug, `${property.slug}-rent`);
  });

  it('an invalid first listing creates nothing and burns no Property ID', async () => {
    const propertiesBefore = (await payload.count({ collection: 'properties', overrideAccess: true })).totalDocs;
    const sequenceBefore = await sequenceValue('rer_property_id_seq');

    const message = await messageOf(
      payload.create({
        collection: 'properties',
        data: { ...baseProperty({ title: 'ITEST Invalid First Listing' }), initialListing: { transactionType: 'rent', status: 'available' } },
        overrideAccess: true,
      }),
    );

    assert.match(message, /needs a Rent Amount/);
    assert.equal((await payload.count({ collection: 'properties', overrideAccess: true })).totalDocs, propertiesBefore);
    assert.equal(await sequenceValue('rer_property_id_seq'), sequenceBefore);
  });

  it('a database failure while creating the first listing rolls back the property and its media folder', async () => {
    await exec(`CREATE OR REPLACE FUNCTION itest_fail_listing() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'itest: simulated listing insert failure'; END; $$ LANGUAGE plpgsql`);
    await exec(`CREATE TRIGGER itest_fail_listing BEFORE INSERT ON listings FOR EACH ROW
      WHEN (NEW.slug LIKE 'itest-rollback%') EXECUTE FUNCTION itest_fail_listing()`);

    try {
      const counts = async () => ({
        properties: (await payload.count({ collection: 'properties', overrideAccess: true })).totalDocs,
        listings: (await payload.count({ collection: 'listings', overrideAccess: true })).totalDocs,
        folders: (await payload.count({ collection: 'payload-folders', overrideAccess: true })).totalDocs,
      });
      const before = await counts();

      const message = await messageOf(
        payload.create({
          collection: 'properties',
          data: {
            ...baseProperty({ title: 'ITEST Rollback Flat' }),
            slug: 'itest-rollback-one',
            initialListing: { transactionType: 'sale', status: 'draft', price: 1_000_000 },
          },
          overrideAccess: true,
        }),
      );

      assert.ok(message.length > 0, 'the save must fail');
      assert.deepEqual(await counts(), before, 'no property, no listing and no media folder left behind');
      const orphan = await payload.find({ collection: 'properties', where: { slug: { equals: 'itest-rollback-one' } }, overrideAccess: true });
      assert.equal(orphan.docs.length, 0);
    } finally {
      await exec('DROP TRIGGER IF EXISTS itest_fail_listing ON listings');
      await exec('DROP FUNCTION IF EXISTS itest_fail_listing()');
    }
  });

  it('visitors cannot create, edit, close or delete listings; staff can', async () => {
    const flat = await makeProperty({ title: 'ITEST Permission Flat' });
    const listing = await makeListing({ property: flat.id, transactionType: 'sale', status: 'available', pricing: { price: 5_000_000 } });

    const anonymous = { overrideAccess: false } as const;
    assert.match(await messageOf(payload.create({ collection: 'listings', data: { property: flat.id, transactionType: 'rent', status: 'draft' }, ...anonymous })), /not allowed/i);
    assert.match(await messageOf(payload.update({ collection: 'listings', id: listing.id, data: { pricing: { price: 1 } }, ...anonymous })), /not allowed/i);
    assert.match(await messageOf(payload.update({ collection: 'listings', id: listing.id, data: { status: 'sold' }, ...anonymous })), /not allowed/i);
    assert.match(await messageOf(payload.delete({ collection: 'listings', id: listing.id, ...anonymous })), /not allowed/i);
    assert.equal((await payload.findByID({ collection: 'listings', id: listing.id, depth: 0, overrideAccess: true })).status, 'available');

    const closed = await payload.update({ collection: 'listings', id: listing.id, data: { status: 'sold' }, overrideAccess: false, user: staff });
    assert.equal(closed.status, 'sold');
  });
});
