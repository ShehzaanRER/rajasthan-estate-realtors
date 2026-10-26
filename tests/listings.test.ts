/**
 * Listings — one physical Property, many independently managed transaction
 * Listings. Covers collections/Listings.ts, its hooks, lib/listings/ and the
 * public search/mapping rules.
 *
 * Pure tests: Payload is replaced by a small in-memory fake, so nothing here
 * touches a database. The same scenarios run against a real PostgreSQL in
 * tests/listings.integration.test.ts when RER_LISTINGS_TEST_DATABASE_URL is set.
 *
 * Run:  npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Listings } from '../collections/Listings';
import { Properties } from '../collections/Properties';
import { assignListingId, formatListingId, RER_LISTING_ID_SEQUENCE } from '../collections/hooks/assignListingId';
import { assignListingSlug } from '../collections/hooks/assignListingSlug';
import { idSequenceSchemaHook } from '../collections/hooks/idSequenceSchema';
import { protectPropertyWithListings } from '../collections/hooks/protectPropertyWithListings';
import {
  syncPropertyRollup,
  syncRollupAfterListingChange,
  syncRollupAfterListingDelete,
} from '../collections/hooks/syncPropertyRollup';
import { ALLOW_INCOMPLETE_PRICING, validateListing } from '../collections/hooks/validateListing';
import { ATTENTION_CHECKS } from '../lib/admin-console/checks';
import {
  planListingFromLegacyProperty,
  summarisePlans,
  type LegacyPropertyInput,
} from '../lib/listings/legacy';
import { onePerProperty, sortLinksByPriority } from '../lib/listings/publicSelection';
import { computePropertyRollup } from '../lib/listings/rollup';
import { findActiveDuplicate, validateListingRules } from '../lib/listings/rules';
import { buildListingSlug } from '../lib/listings/slug';
import { sortListingSummaries, summariseListing } from '../lib/listings/summary';
import { publicListingsWhere } from '../lib/properties/listingsWhere';
import { mapListing, mapListingLink } from '../lib/properties/mapListing';
import type { Listing, Property } from '../payload-types';
import {
  buildInitialListing,
  createInitialListing,
  INITIAL_LISTING_CONTEXT_KEY,
  validateInitialListing,
} from '../collections/hooks/initialListing';
import { ACTIVE_LISTING_INDEX, ACTIVE_LISTING_INDEX_WHERE } from '../collections/hooks/listingIndexSchema';
import {
  DUPLICATE_ACTIVE_LISTING_MESSAGE,
  explainDuplicateListingError,
  isDuplicateActiveListingError,
} from '../collections/hooks/listingErrors';
import { isLocalDatabaseUrl, schemaPushDecision, writeTargetError } from '../lib/databaseSafety';
import { ACTIVE_LISTING_STATUSES, CLOSED_LISTING_STATUSES } from '../lib/listings/vocabulary';

// --- an in-memory Payload ------------------------------------------------------

type Row = Record<string, any>;

function matches(row: Row, where: Row | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(([field, condition]) => {
    if (field === 'and') return (condition as Row[]).every((w) => matches(row, w));
    if (field === 'or') return (condition as Row[]).some((w) => matches(row, w));
    const value = row[field];
    const comparable = typeof value === 'object' && value ? value.id : value;
    const op = condition as Row;
    if ('equals' in op) return String(comparable) === String(op.equals);
    if ('not_equals' in op) return String(comparable) !== String(op.not_equals);
    if ('in' in op) return (op.in as unknown[]).map(String).includes(String(comparable));
    if ('like' in op) return String(comparable ?? '').includes(String(op.like));
    throw new Error(`fake payload: unsupported operator ${JSON.stringify(op)}`);
  });
}

function fakePayload(seed: { properties?: Row[]; listings?: Row[] } = {}, sequences = new Map<string, number>()) {
  const store: Record<string, Row[]> = {
    properties: (seed.properties ?? []).map((row) => ({ ...row })),
    listings: (seed.listings ?? []).map((row) => ({ ...row })),
  };
  const writes: Array<{ collection: string; id: unknown; data: Row }> = [];
  const sql: string[] = [];

  const payload = {
    store,
    writes,
    sql,
    logger: { warn: () => undefined },
    async find({ collection, where }: { collection: string; where?: Row }) {
      const docs = store[collection].filter((row) => matches(row, where));
      return { docs, totalDocs: docs.length, hasNextPage: false };
    },
    async findByID({ collection, id }: { collection: string; id: number | string }) {
      return store[collection].find((row) => String(row.id) === String(id)) ?? null;
    },
    async count({ collection, where }: { collection: string; where?: Row }) {
      return { totalDocs: store[collection].filter((row) => matches(row, where)).length };
    },
    async update({ collection, id, data }: { collection: string; id: number | string; data: Row }) {
      writes.push({ collection, id, data });
      const row = store[collection].find((r) => String(r.id) === String(id));
      if (!row) throw new Error('fake payload: update of missing doc');
      Object.assign(row, data);
      return row;
    },
    db: {
      drizzle: {
        async execute(query: { queryChunks?: unknown[] }) {
          const text = String(
            (query.queryChunks ?? []).map((chunk) => (chunk as { value?: string[] }).value?.join('') ?? '').join(''),
          );
          sql.push(text);
          const nextval = text.match(/SELECT nextval\('(\w+)'\)/);
          if (nextval) {
            const next = (sequences.get(nextval[1]) ?? 0) + 1;
            sequences.set(nextval[1], next);
            return { rows: [{ nextval: String(next) }] };
          }
          return { rows: [] };
        },
      },
    },
  };

  return payload;
}

const reqFor = (payload: unknown, user: unknown = { id: 1 }) => ({ payload, user, t: (key: string) => key }) as never;

// --- fixtures ------------------------------------------------------------------

const UNITED_TOWER: Row = {
  id: 1,
  propertyId: 'RER-00001',
  slug: '2-bhk-apartment-andheri-west-rer-00001',
  title: 'United Tower 2 BHK',
  status: 'draft',
  isTenanted: false,
  rentHistory: [],
};

function listingRow(overrides: Row = {}): Row {
  return {
    id: 100,
    listingId: 'RER-L-00001',
    property: 1,
    slug: UNITED_TOWER.slug,
    transactionType: 'sale',
    status: 'available',
    pricing: { price: 22_500_000 },
    ...overrides,
  };
}

async function runValidate(
  payload: ReturnType<typeof fakePayload>,
  data: Row,
  options: { originalDoc?: Row; operation?: 'create' | 'update'; context?: Row; user?: unknown } = {},
) {
  return validateListing({
    data,
    originalDoc: options.originalDoc,
    operation: options.operation ?? 'create',
    req: reqFor(payload, options.user),
    context: options.context ?? {},
  } as never);
}

async function validationMessages(promise: Promise<unknown>): Promise<string[]> {
  try {
    await promise;
    return [];
  } catch (error) {
    const data = (error as { data?: { errors?: Array<{ message: string; path: string }> } }).data;
    return (data?.errors ?? []).map((e) => `${e.path}: ${e.message}`);
  }
}

// --- 1-4. Creating and adding listings --------------------------------------------

describe('a property can carry a Sale listing, a Rent listing, or both', () => {
  it('1. creates a property with a sale listing (ID, slug and rollup follow)', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    const req = reqFor(payload);
    const sequences = new Map<string, number>();
    const idPayload = fakePayload({}, sequences);

    const data: Row = { property: 1, transactionType: 'sale', status: 'available', pricing: { price: 22_500_000 } };
    await assignListingId({ data, operation: 'create', req: reqFor(idPayload) } as never);
    await assignListingSlug({ data, operation: 'create', req } as never);
    await runValidate(payload, data);

    assert.equal(data.listingId, 'RER-L-00001');
    assert.equal(data.slug, UNITED_TOWER.slug, 'the first listing keeps the property slug (URL unchanged)');

    payload.store.listings.push({ id: 100, ...data });
    await syncPropertyRollup({ payload: payload as never, propertyId: 1 });
    assert.equal(payload.store.properties[0].status, 'available');
    assert.equal(payload.store.properties[0].isTenanted, false);
  });

  it('2. creates a property with a rental listing', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    const data: Row = { property: 1, transactionType: 'rent', status: 'available', pricing: { rentAmount: 75_000 } };
    await assignListingSlug({ data, operation: 'create', req: reqFor(payload) } as never);
    await runValidate(payload, data);

    assert.equal(data.slug, UNITED_TOWER.slug);
    payload.store.listings.push({ id: 101, listingId: 'RER-L-00002', ...data });
    await syncPropertyRollup({ payload: payload as never, propertyId: 1 });
    assert.equal(payload.store.properties[0].status, 'available');
  });

  it('3. adds a rental listing to a property that already has a sale listing', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [listingRow()] });
    const data: Row = { property: 1, transactionType: 'rent', status: 'available', pricing: { rentAmount: 75_000, securityDeposit: 300_000 } };

    await assignListingSlug({ data, operation: 'create', req: reqFor(payload) } as never);
    assert.equal(await validationMessages(runValidate(payload, data)).then((m) => m.length), 0);
    assert.equal(data.slug, `${UNITED_TOWER.slug}-rent`, 'the second listing gets its own derived URL');
  });

  it('4. adds a sale listing to a property that already has a rental listing', async () => {
    const payload = fakePayload({
      properties: [UNITED_TOWER],
      listings: [listingRow({ transactionType: 'rent', pricing: { rentAmount: 75_000 } })],
    });
    const data: Row = { property: 1, transactionType: 'sale', status: 'available', pricing: { price: 22_500_000 } };

    await assignListingSlug({ data, operation: 'create', req: reqFor(payload) } as never);
    assert.equal((await validationMessages(runValidate(payload, data))).length, 0);
    assert.equal(data.slug, `${UNITED_TOWER.slug}-sale`);
  });

  it('allocates sequential Listing IDs without touching the Property ID series', async () => {
    const sequences = new Map<string, number>([['rer_property_id_seq', 22]]);
    const payload = fakePayload({}, sequences);
    const first: Row = {};
    const second: Row = {};
    await assignListingId({ data: first, operation: 'create', req: reqFor(payload) } as never);
    await assignListingId({ data: second, operation: 'create', req: reqFor(payload) } as never);

    assert.deepEqual([first.listingId, second.listingId], ['RER-L-00001', 'RER-L-00002']);
    assert.equal(sequences.get('rer_property_id_seq'), 22, 'property sequence is never advanced by a listing');
    assert.ok(payload.sql.every((s) => !s.includes('rer_property_id_seq')));
  });

  it('never rewrites a Listing ID on update', async () => {
    const payload = fakePayload();
    const out = (await assignListingId({
      data: { listingId: 'RER-L-99999' },
      originalDoc: { listingId: 'RER-L-00007' },
      operation: 'update',
      req: reqFor(payload),
    } as never)) as Row;
    assert.equal(out.listingId, 'RER-L-00007');
  });

  it('formats Listing IDs as RER-L-00000 (distinct from RER-00000 property IDs)', () => {
    assert.equal(formatListingId(31), 'RER-L-00031');
    assert.notEqual(formatListingId(1), 'RER-00001');
  });
});

// --- 5-6. Independent editing and closing ----------------------------------------

describe('listings are managed independently', () => {
  const sale = () => listingRow({ id: 100, transactionType: 'sale', pricing: { price: 22_500_000 }, status: 'available' });
  const rent = () =>
    listingRow({ id: 101, listingId: 'RER-L-00002', slug: `${UNITED_TOWER.slug}-rent`, transactionType: 'rent', pricing: { rentAmount: 75_000, securityDeposit: 300_000 }, status: 'available' });

  it('5. editing one listing\'s price and status leaves the other untouched', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [sale(), rent()] });
    const rentBefore = structuredClone(payload.store.listings[1]);

    // The sale price drops and goes under offer.
    const data: Row = { pricing: { price: 21_000_000 }, status: 'under-offer' };
    assert.deepEqual(await validationMessages(runValidate(payload, data, { operation: 'update', originalDoc: payload.store.listings[0] })), []);
    Object.assign(payload.store.listings[0], data);
    await syncRollupAfterListingChange({ doc: payload.store.listings[0], previousDoc: sale(), req: reqFor(payload), context: {} } as never);

    assert.deepEqual(payload.store.listings[1], rentBefore, 'the rental is byte-for-byte unchanged');
    assert.equal(payload.store.listings[0].pricing.price, 21_000_000);
    assert.equal(payload.store.listings[1].pricing.rentAmount, 75_000);
  });

  it('6a. closing the rental keeps the sale active; the property stays live', async () => {
    const payload = fakePayload({
      properties: [{ ...UNITED_TOWER, rentHistory: [{ licenseeName: 'A. Tenant' }] }],
      listings: [sale(), rent()],
    });

    const closed = { ...payload.store.listings[1], status: 'rented' };
    assert.deepEqual(
      await validationMessages(runValidate(payload, { status: 'rented' }, { operation: 'update', originalDoc: payload.store.listings[1] })),
      [],
    );
    Object.assign(payload.store.listings[1], closed);
    await syncRollupAfterListingChange({ doc: closed, previousDoc: rent(), req: reqFor(payload), context: {} } as never);

    assert.equal(payload.store.listings[0].status, 'available', 'sale listing is still available');
    assert.equal(payload.store.properties[0].status, 'available', 'property is still live because the sale is');
    assert.equal(payload.store.properties[0].isTenanted, true, 'the tenancy is tracked separately from status');
    assert.ok(payload.writes.every((w) => w.collection === 'properties'), 'only the property summary was written');
  });

  it('6b. closing the sale keeps the rental active', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [sale(), rent()] });
    Object.assign(payload.store.listings[0], { status: 'sold' });
    await syncRollupAfterListingChange({ doc: payload.store.listings[0], previousDoc: sale(), req: reqFor(payload), context: {} } as never);

    assert.equal(payload.store.listings[1].status, 'available');
    assert.equal(payload.store.properties[0].status, 'available');
    assert.ok(payload.writes.every((w) => w.collection === 'properties'));
  });

  it('a property with every listing closed leaves the public set', async () => {
    const payload = fakePayload({
      properties: [{ ...UNITED_TOWER, status: 'available' }],
      listings: [sale(), rent()],
    });
    payload.store.listings[0].status = 'sold';
    payload.store.listings[1].status = 'withdrawn';
    await syncPropertyRollup({ payload: payload as never, propertyId: 1 });
    assert.equal(payload.store.properties[0].status, 'sold');
  });

  it('only writes the property when its summary actually changed', async () => {
    const payload = fakePayload({ properties: [{ ...UNITED_TOWER, status: 'available' }], listings: [sale()] });
    await syncPropertyRollup({ payload: payload as never, propertyId: 1 });
    assert.equal(payload.writes.length, 0);
  });

  it('deleting a listing refreshes the property but never deletes anything', async () => {
    const payload = fakePayload({ properties: [{ ...UNITED_TOWER, status: 'available' }], listings: [sale(), rent()] });
    payload.store.listings = payload.store.listings.filter((l) => l.id !== 100); // the sale listing is gone
    await syncRollupAfterListingDelete({ doc: sale(), req: reqFor(payload) } as never);

    assert.equal(payload.store.properties.length, 1, 'property survives');
    assert.equal(payload.store.listings.length, 1, 'the other listing survives');
    assert.equal(payload.store.properties[0].status, 'available', 'rental keeps the property live');
  });

  it('a property that still has listings cannot be deleted', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [sale()] });
    await assert.rejects(
      protectPropertyWithListings({ id: 1, req: reqFor(payload), collection: {} as never, context: {} }),
      /still has 1 listing/,
    );
    const empty = fakePayload({ properties: [UNITED_TOWER] });
    await protectPropertyWithListings({ id: 1, req: reqFor(empty), collection: {} as never, context: {} });
  });
});

// --- backend validation -------------------------------------------------------------

describe('listing rules are enforced on the server', () => {
  it('rejects a listing whose property does not exist', async () => {
    const payload = fakePayload();
    const messages = await validationMessages(
      runValidate(payload, { property: 999, transactionType: 'sale', status: 'draft' }),
    );
    assert.ok(messages.some((m) => m.startsWith('property:') && /does not exist/.test(m)), String(messages));
  });

  it('rejects a listing with no property', async () => {
    const messages = await validationMessages(runValidate(fakePayload(), { transactionType: 'sale', status: 'draft' }));
    assert.ok(messages.some((m) => m.startsWith('property:')));
  });

  it('rejects moving a listing to another property', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER, { ...UNITED_TOWER, id: 2 }], listings: [listingRow()] });
    const messages = await validationMessages(
      runValidate(payload, { property: 2 }, { operation: 'update', originalDoc: payload.store.listings[0] }),
    );
    assert.ok(messages.some((m) => /cannot be moved/.test(m)), String(messages));
  });

  it('blocks a second ACTIVE listing of the same transaction type', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [listingRow()] });
    const messages = await validationMessages(
      runValidate(payload, { property: 1, transactionType: 'sale', status: 'draft' }),
    );
    assert.ok(messages.some((m) => /already has an active Sale listing \(RER-L-00001\)/.test(m)), String(messages));
  });

  it('allows a new listing once the earlier one of that type is closed', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [listingRow({ status: 'sold' })] });
    const messages = await validationMessages(
      runValidate(payload, { property: 1, transactionType: 'sale', status: 'available', pricing: { price: 1 } }),
    );
    assert.deepEqual(messages, []);
  });

  it('does not count a listing against itself on update', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [listingRow()] });
    const messages = await validationMessages(
      runValidate(payload, { pricing: { price: 20_000_000 } }, { operation: 'update', originalDoc: payload.store.listings[0] }),
    );
    assert.deepEqual(messages, []);
  });

  it('requires a tenancy on the property before a rental can be marked Rented', async () => {
    const payload = fakePayload({
      properties: [UNITED_TOWER],
      listings: [listingRow({ transactionType: 'rent', pricing: { rentAmount: 75_000 } })],
    });
    const messages = await validationMessages(
      runValidate(payload, { status: 'rented' }, { operation: 'update', originalDoc: payload.store.listings[0] }),
    );
    assert.ok(messages.some((m) => /Tenancy History/.test(m)), String(messages));
  });

  it('requires an amount before a listing goes live, but not for drafts', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    const live = await validationMessages(runValidate(payload, { property: 1, transactionType: 'rent', status: 'available' }));
    assert.ok(live.some((m) => m.startsWith('pricing.rentAmount')), String(live));

    const draft = await validationMessages(runValidate(payload, { property: 1, transactionType: 'rent', status: 'draft' }));
    assert.deepEqual(draft, []);
  });

  it('the migration flag lets an incomplete live listing through', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    const data = { property: 1, transactionType: 'sale', status: 'available' };
    assert.equal((await validationMessages(runValidate(payload, data))).length, 1);
    assert.deepEqual(await validationMessages(runValidate(payload, data, { context: { [ALLOW_INCOMPLETE_PRICING]: true } })), []);
  });

  it('honours the signed-in user\'s read access to the property', async () => {
    // A hook for a scripted write (no user) skips access; a signed-in user's
    // request is checked. With the fake, an unreadable property is "not found".
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    payload.findByID = async () => null;
    const messages = await validationMessages(runValidate(payload, { property: 1, transactionType: 'sale', status: 'draft' }));
    assert.ok(messages.some((m) => /does not exist, or you do not have access/.test(m)));
  });
});

describe('pure listing rules', () => {
  it('sale cannot be Rented; rent and lease cannot be Sold', () => {
    assert.equal(validateListingRules({ transactionType: 'sale', status: 'rented' }).length, 1);
    assert.equal(validateListingRules({ transactionType: 'rent', status: 'sold' }).length, 1);
    assert.equal(validateListingRules({ transactionType: 'lease', status: 'sold' }).length, 1);
    assert.equal(validateListingRules({ transactionType: 'sale', status: 'sold' }).length, 0);
    assert.equal(validateListingRules({ transactionType: 'rent', status: 'rented' }, { parentHasTenancyHistory: true }).length, 0);
  });

  it('price on request satisfies the amount rule', () => {
    assert.deepEqual(
      validateListingRules({ transactionType: 'sale', status: 'available', pricing: { priceOnRequest: true } }),
      [],
    );
  });

  it('lease accepts either lease amount', () => {
    const base = { transactionType: 'lease', status: 'available' } as const;
    assert.deepEqual(validateListingRules({ ...base, pricing: { monthlyLeasePayment: 10 } }), []);
    assert.deepEqual(validateListingRules({ ...base, pricing: { totalLeaseAmount: 10 } }), []);
    assert.equal(validateListingRules({ ...base, pricing: {} }).length, 1);
  });

  it('rejects negative amounts and unknown values', () => {
    assert.equal(validateListingRules({ transactionType: 'sale', status: 'draft', pricing: { price: -5 } }).length, 1);
    assert.equal(validateListingRules({ transactionType: 'weekly', status: 'draft' }).length, 1);
    assert.equal(validateListingRules({ transactionType: 'sale', status: 'archived' }).length, 1);
  });

  it('findActiveDuplicate ignores closed siblings and other types', () => {
    const siblings = [
      { id: 1, transactionType: 'sale', status: 'sold' },
      { id: 2, transactionType: 'rent', status: 'available' },
    ];
    assert.equal(findActiveDuplicate({ transactionType: 'sale', status: 'draft' }, siblings), null);
    assert.equal(findActiveDuplicate({ transactionType: 'rent', status: 'draft' }, siblings)?.id, 2);
    assert.equal(findActiveDuplicate({ id: 2, transactionType: 'rent', status: 'draft' }, siblings), null);
    assert.equal(findActiveDuplicate({ transactionType: 'rent', status: 'sold' }, siblings), null, 'a closing listing cannot collide');
  });
});

describe('property roll-up', () => {
  it('prefers Available, then Under offer, then closed states', () => {
    const rollup = (...pairs: Array<[string, string]>) =>
      computePropertyRollup(pairs.map(([transactionType, status]) => ({ transactionType, status })));

    assert.equal(rollup(['sale', 'sold'], ['rent', 'available']).status, 'available');
    assert.equal(rollup(['sale', 'under-offer'], ['rent', 'draft']).status, 'under-offer');
    assert.equal(rollup(['sale', 'sold'], ['rent', 'rented']).status, 'rented');
    assert.equal(rollup(['sale', 'sold']).status, 'sold');
    assert.equal(rollup(['sale', 'withdrawn']).status, 'draft');
    assert.equal(rollup().status, 'draft');
  });

  it('isTenanted follows rented rent/lease listings only', () => {
    assert.equal(computePropertyRollup([{ transactionType: 'rent', status: 'rented' }]).isTenanted, true);
    assert.equal(computePropertyRollup([{ transactionType: 'lease', status: 'rented' }]).isTenanted, true);
    assert.equal(computePropertyRollup([{ transactionType: 'sale', status: 'sold' }]).isTenanted, false);
    assert.equal(computePropertyRollup([{ transactionType: 'rent', status: 'available' }]).isTenanted, false);
  });
});

describe('listing slugs', () => {
  const taken = (...slugs: string[]) => new Set(slugs);

  it('first listing keeps the property slug exactly, including legacy mixed case', () => {
    assert.equal(buildListingSlug({ propertySlug: 'Andheri', transactionType: 'sale', taken: taken() }), 'Andheri');
  });

  it('later listings add the transaction type, then a number', () => {
    assert.equal(buildListingSlug({ propertySlug: 'a-1', transactionType: 'rent', taken: taken('a-1') }), 'a-1-rent');
    assert.equal(buildListingSlug({ propertySlug: 'a-1', transactionType: 'rent', taken: taken('a-1', 'a-1-rent') }), 'a-1-rent-2');
  });

  it('returns null without a property slug', () => {
    assert.equal(buildListingSlug({ propertySlug: '  ', transactionType: 'sale', taken: taken() }), null);
  });

  it('an explicit slug on create is left alone', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER] });
    const data: Row = { property: 1, transactionType: 'rent', slug: 'custom-slug' };
    await assignListingSlug({ data, operation: 'create', req: reqFor(payload) } as never);
    assert.equal(data.slug, 'custom-slug');
  });

  it('never regenerates a slug on update', async () => {
    const payload = fakePayload({ properties: [UNITED_TOWER], listings: [listingRow()] });
    const data: Row = { property: 1, transactionType: 'sale' };
    await assignListingSlug({ data, operation: 'update', req: reqFor(payload) } as never);
    assert.equal(data.slug, undefined);
  });
});

// --- 7-8. Search ---------------------------------------------------------------------

describe('public search is built from listings', () => {
  it('7a. a sale search filters sale listings on the sale price field', () => {
    const where = publicListingsWhere({ purpose: 'sale', minPrice: 1_000_000, maxPrice: 2_000_000 });
    const clauses = (where as { and: Row[] }).and;
    assert.deepEqual(clauses[0], { status: { in: ['available', 'under-offer'] } });
    assert.ok(clauses.some((c) => c.transactionType?.equals === 'sale'));
    assert.ok(clauses.some((c) => c['pricing.price']?.greater_than_equal === 1_000_000));
    assert.ok(clauses.some((c) => c['pricing.price']?.less_than === 2_000_000));
    assert.ok(!JSON.stringify(where).includes('rentAmount'));
  });

  it('7b. a rent search filters rental listings on the rent field', () => {
    const where = publicListingsWhere({ purpose: 'rent', maxPrice: 80_000 });
    assert.ok(JSON.stringify(where).includes('"transactionType":{"equals":"rent"}'));
    assert.ok(JSON.stringify(where).includes('pricing.rentAmount'));
    assert.ok(!JSON.stringify(where).includes('pricing.price'));
  });

  it('physical filters reach through the property; transaction filters stay on the listing', () => {
    const where = JSON.stringify(
      publicListingsWhere({ purpose: 'rent', category: 'residential', locality: 'Andheri West', bhk: 2 }),
    );
    assert.ok(where.includes('property.propertyCategory'));
    assert.ok(where.includes('property.location.locality'));
    assert.ok(where.includes('property.details.bedrooms'));
  });

  it('an unfiltered search applies no budget and no transaction type', () => {
    const where = JSON.stringify(publicListingsWhere({ minPrice: 5, maxPrice: 9 }));
    assert.ok(!where.includes('pricing.'), 'a budget without a purpose is skipped, never applied to the wrong column');
    assert.ok(!where.includes('transactionType'));
  });

  it('only public statuses can match', () => {
    assert.deepEqual((publicListingsWhere({}) as Row).status, { in: ['available', 'under-offer'] });
  });
});

function populatedListing(overrides: Row = {}, propertyOverrides: Row = {}): Listing {
  const property = {
    id: 1,
    propertyId: 'RER-00001',
    slug: UNITED_TOWER.slug,
    title: 'United Tower 2 BHK',
    status: 'available',
    propertyType: 'apartment',
    propertyCategory: 'residential',
    location: { locality: 'Andheri West', city: 'Mumbai' },
    details: { bedrooms: 2, carpetArea: 780, carpetAreaUnit: 'sq-ft' },
    tags: ['featured', 'ready-to-move'],
    media: {},
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...propertyOverrides,
  };

  return {
    id: 100,
    listingId: 'RER-L-00001',
    property,
    slug: UNITED_TOWER.slug,
    transactionType: 'sale',
    status: 'available',
    pricing: { price: 22_500_000 },
    tags: [],
    updatedAt: '2026-01-02T00:00:00.000Z',
    createdAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  } as unknown as Listing;
}

describe('listings render with their own transaction details and the shared property', () => {
  it('each listing shows its own price and terms; the specification is identical', () => {
    const sale = mapListing(populatedListing())!;
    const rent = mapListing(
      populatedListing({
        id: 101,
        listingId: 'RER-L-00002',
        slug: `${UNITED_TOWER.slug}-rent`,
        transactionType: 'rent',
        pricing: { rentAmount: 75_000, securityDeposit: 300_000 },
      }),
    )!;

    assert.equal(sale.pricing.displayPrice, '₹2.25 Cr');
    assert.equal(rent.pricing.displayPrice, '₹75,000 / month');
    assert.equal(rent.pricing.securityDeposit, 300_000);
    assert.equal(sale.pricing.securityDeposit, null, 'the sale has no deposit — deposits are per listing');
    assert.equal(sale.purposeLabel, 'Sale');
    assert.equal(rent.purposeLabel, 'Rent');

    // Shared, physical facts are the same object content on both.
    assert.equal(sale.propertyId, rent.propertyId);
    assert.deepEqual(sale.location, rent.location);
    assert.equal(sale.areaDisplay, rent.areaDisplay);
    assert.equal(sale.title, rent.title);
    // ...but the identifiers and URLs differ.
    assert.notEqual(sale.listingId, rent.listingId);
    assert.notEqual(sale.slug, rent.slug);
  });

  it('exposes the master Property ID and the Listing ID separately', () => {
    const sale = mapListing(populatedListing())!;
    assert.equal(sale.propertyId, 'RER-00001');
    assert.equal(sale.listingId, 'RER-L-00001');
  });

  it('9. refuses anything that is not public', () => {
    assert.equal(mapListing(populatedListing({ status: 'draft' })), null);
    assert.equal(mapListing(populatedListing({ status: 'sold' })), null);
    assert.equal(mapListing(populatedListing({ status: 'rented' })), null);
    assert.equal(mapListing(populatedListing({ status: 'withdrawn' })), null);
    assert.ok(mapListing(populatedListing({ status: 'under-offer' })));
  });

  it('refuses a listing whose property was not populated (unreadable to the visitor)', () => {
    assert.equal(mapListing(populatedListing({ property: 1 })), null);
  });

  it('featured is a listing tag: a legacy tag on the property never features a listing', () => {
    // The property still carries the legacy `featured` tag; the listing has none.
    assert.equal(mapListing(populatedListing({ tags: [] }))!.featured, false);
    assert.equal(mapListing(populatedListing({ tags: ['featured'] }))!.featured, true);
    // Unit-level property tags still come through.
    assert.ok(mapListing(populatedListing())!.tags.includes('ready-to-move'));
  });

  it('badges follow the listing\'s own tags', () => {
    assert.equal(mapListing(populatedListing({ tags: ['price-reduced'] }))!.badge, 'Price Reduced');
    assert.equal(mapListing(populatedListing())!.badge, 'For Sale');
  });

  it('carries sibling listings but never itself', () => {
    const rentLink = mapListingLink(
      populatedListing({ id: 101, listingId: 'RER-L-00002', slug: 'x-rent', transactionType: 'rent', pricing: { rentAmount: 75_000 } }),
    )!;
    const selfLink = mapListingLink(populatedListing())!;
    const mapped = mapListing(populatedListing(), { otherListings: [rentLink, selfLink] })!;

    assert.deepEqual(mapped.otherListings.map((l) => l.listingId), ['RER-L-00002']);
    assert.equal(mapped.otherListings[0].displayPrice, '₹75,000 / month');
    assert.equal(mapListingLink(populatedListing({ status: 'draft' })), null, 'draft siblings are not advertised');
  });
});

describe('8. one card per physical property', () => {
  const sale = { id: 'S', property: 1, transactionType: 'sale' };
  const rent = { id: 'R', property: 1, transactionType: 'rent' };
  const lease = { id: 'L', property: 1, transactionType: 'lease' };
  const other = { id: 'O', property: 2, transactionType: 'rent' };
  const key = (l: Row) => l.property;
  const type = (l: Row) => l.transactionType;

  it('an unfiltered search shows a property with both listings once, as its Sale listing', () => {
    const result = onePerProperty([rent, sale, other], key, type);
    assert.deepEqual(result.map((l) => l.id), ['S', 'O'], 'keeps first-seen position, swaps in the higher-priority listing');
  });

  it('a filtered search is unaffected', () => {
    assert.deepEqual(onePerProperty([rent, other], key, type).map((l) => l.id), ['R', 'O']);
    assert.deepEqual(onePerProperty([sale], key, type).map((l) => l.id), ['S']);
  });

  it('priority is Sale, then Rent, then Lease', () => {
    assert.equal(onePerProperty([lease, rent], key, type)[0].id, 'R');
    assert.deepEqual(
      sortLinksByPriority([{ transactionType: 'lease' as const }, { transactionType: 'sale' as const }, { transactionType: 'rent' as const }]).map((l) => l.transactionType),
      ['sale', 'rent', 'lease'],
    );
  });

  it('never returns the same property twice, however many listings it has', () => {
    const result = onePerProperty([lease, rent, sale, other], key, type);
    assert.equal(new Set(result.map(key)).size, result.length);
  });

  it('drops listings with no resolvable property', () => {
    assert.deepEqual(onePerProperty([{ id: 'X', property: null, transactionType: 'sale' }] as Row[], key, type), []);
  });
});

// --- 9. permissions ------------------------------------------------------------------

describe('9. public visibility and permissions', () => {
  const anonymous = { req: { user: null } } as never;
  const staff = { req: { user: { id: 1 } } } as never;
  const access = Listings.access!;

  it('anonymous visitors can read only live listings', async () => {
    assert.deepEqual(await (access.read as Function)(anonymous), { status: { in: ['available', 'under-offer'] } });
    assert.equal(await (access.read as Function)(staff), true);
  });

  it('only signed-in staff can create, update or delete listings', async () => {
    for (const operation of ['create', 'update', 'delete'] as const) {
      assert.equal(await (access[operation] as Function)(anonymous), false, `${operation} must be denied to visitors`);
      assert.equal(await (access[operation] as Function)(staff), true);
    }
  });

  it('property access is unchanged: public only while a listing keeps it live', async () => {
    const read = Properties.access!.read as Function;
    assert.deepEqual(await read(anonymous), { status: { in: ['available', 'under-offer'] } });
    assert.equal(await read(staff), true);
  });

  it('internal listing fields are staff-only', () => {
    const internal = Listings.fields.flatMap((field) => (field.type === 'tabs' ? field.tabs.flatMap((t) => t.fields) : [field]));
    for (const name of ['assignedAgent', 'internalNotes']) {
      const field = internal.find((f) => 'name' in f && f.name === name) as { access?: { read?: Function } };
      assert.ok(field?.access?.read, `${name} needs a read gate`);
      assert.equal(field.access!.read!({ req: { user: null } }), false);
      assert.equal(field.access!.read!({ req: { user: { id: 1 } } }), true);
    }
  });

  it('a property\'s own status is system-managed, not user-editable', async () => {
    const status = Properties.fields.find((f) => 'name' in f && f.name === 'status') as { access?: { update?: Function } };
    assert.equal(await status.access!.update!(), false);
  });
});

// --- 10-12. Migration of legacy records ------------------------------------------------

describe('legacy property -> listing migration plan', () => {
  const legacy = (overrides: Partial<LegacyPropertyInput> = {}): LegacyPropertyInput => ({
    id: 25,
    propertyId: 'RER-00001',
    slug: '1-bhk-apartment-jogeshwari-west-rer-00001',
    purpose: 'rent',
    status: 'rented',
    tags: [],
    pricing: { rentAmount: 35_000, securityDeposit: 200_000 },
    ...overrides,
  });

  it('10. a rented rental becomes a rented rent listing with every amount preserved', () => {
    const input = legacy();
    const snapshot = structuredClone(input);
    const plan = planListingFromLegacyProperty(input);

    assert.equal(plan.action, 'create');
    assert.deepEqual(plan.listing?.pricing, { rentAmount: 35_000, securityDeposit: 200_000 });
    assert.equal(plan.listing?.transactionType, 'rent');
    assert.equal(plan.listing?.status, 'rented');
    assert.equal(plan.listing?.property, 25);
    assert.deepEqual(plan.issues, []);
    assert.deepEqual(input, snapshot, 'the legacy record is never mutated — nothing is moved, only copied');
  });

  it('10. an available sale keeps its price and its public URL', () => {
    const plan = planListingFromLegacyProperty(
      legacy({ id: 44, propertyId: 'RER-00020', slug: '2-bhk-apartment-jogeshwari-west-rer-00020', purpose: 'sale', status: 'available', pricing: { price: 20_500_000 } }),
    );
    assert.equal(plan.listing?.slug, '2-bhk-apartment-jogeshwari-west-rer-00020');
    assert.equal(plan.listing?.pricing.price, 20_500_000);
  });

  it('keeps a legacy mixed-case slug exactly', () => {
    assert.equal(planListingFromLegacyProperty(legacy({ slug: 'New1', purpose: 'sale', status: 'draft' })).listing?.slug, 'New1');
  });

  it('moves only the marketing tags to the listing', () => {
    const plan = planListingFromLegacyProperty(legacy({ tags: ['featured', 'residential', 'ready-to-move', 'price-reduced'] }));
    assert.deepEqual(plan.listing?.tags, ['featured', 'price-reduced']);
  });

  it('11. is idempotent: a property that already has a listing of that type is skipped', () => {
    const plan = planListingFromLegacyProperty(legacy(), [{ transactionType: 'rent' }]);
    assert.equal(plan.action, 'skip-existing');
    assert.equal(plan.listing, null);
  });

  it('11. a listing of a different type does not block the legacy one', () => {
    assert.equal(planListingFromLegacyProperty(legacy(), [{ transactionType: 'sale' }]).action, 'create');
  });

  it('11. repeated runs against an in-memory store create each listing exactly once', () => {
    const properties = [
      legacy(),
      legacy({ id: 26, propertyId: 'RER-00002', slug: 'b', purpose: 'sale', status: 'available', pricing: { price: 5 } }),
      legacy({ id: 27, propertyId: 'RER-00003', slug: 'c', purpose: 'rent', status: 'available', pricing: { rentAmount: 5 } }),
    ];
    const store: Array<{ property: number | string; transactionType: unknown }> = [];

    const run = () => {
      for (const property of properties) {
        const existing = store.filter((l) => String(l.property) === String(property.id));
        const plan = planListingFromLegacyProperty(property, existing);
        if (plan.action === 'create' && plan.listing) store.push(plan.listing);
      }
    };

    run();
    assert.equal(store.length, 3);
    run();
    run();
    assert.equal(store.length, 3, 'reruns create nothing');
  });

  it('flags a Sale record marked Rented instead of guessing: created as Draft, original recorded', () => {
    const plan = planListingFromLegacyProperty(legacy({ purpose: 'sale', status: 'rented', pricing: { price: 1 } }));
    assert.equal(plan.action, 'create');
    assert.equal(plan.listing?.status, 'draft');
    assert.match(plan.listing!.internalNotes, /Original status "rented"/);
    assert.equal(plan.issues[0].code, 'incompatible-status');
  });

  it('warns about a live listing with no price but still carries it across', () => {
    const plan = planListingFromLegacyProperty(legacy({ purpose: 'sale', status: 'available', pricing: {} }));
    assert.equal(plan.action, 'create');
    assert.equal(plan.issues[0].code, 'live-without-price');
  });

  it('does not warn when price on request is set', () => {
    const plan = planListingFromLegacyProperty(legacy({ purpose: 'sale', status: 'available', pricing: { priceOnRequest: true } }));
    assert.deepEqual(plan.issues, []);
  });

  it('warns when a rent record has only a sale price (the site showed it as rent)', () => {
    const plan = planListingFromLegacyProperty(legacy({ status: 'available', pricing: { price: 40_000 } }));
    assert.ok(plan.issues.some((i) => i.code === 'rent-from-sale-price'));
    assert.equal(plan.listing?.pricing.price, 40_000, 'the value is preserved, not dropped');
  });

  it('reports — and does not migrate — values a listing cannot hold', () => {
    const cases: Array<[Partial<LegacyPropertyInput>, string]> = [
      [{ purpose: 'weekly' }, 'invalid-purpose'],
      [{ purpose: undefined }, 'invalid-purpose'],
      [{ slug: '' }, 'missing-slug'],
      [{ status: 'archived' }, 'invalid-status'],
      [{ pricing: { rentAmount: -1 } }, 'negative-amount'],
    ];
    for (const [overrides, code] of cases) {
      const plan = planListingFromLegacyProperty(legacy(overrides));
      assert.equal(plan.action, 'skip-error', code);
      assert.equal(plan.listing, null);
      assert.ok(plan.issues.some((i) => i.code === code && i.level === 'error'), `${code}: ${JSON.stringify(plan.issues)}`);
    }
  });

  it('summarises a mixed batch', () => {
    const summary = summarisePlans([
      planListingFromLegacyProperty(legacy()),
      planListingFromLegacyProperty(legacy({ id: 2 }), [{ transactionType: 'rent' }]),
      planListingFromLegacyProperty(legacy({ id: 3, purpose: 'nope' })),
      planListingFromLegacyProperty(legacy({ id: 4, purpose: 'sale', status: 'available', pricing: {} })),
    ]);
    assert.deepEqual(summary, { total: 4, create: 2, skipExisting: 1, skipError: 1, warnings: 1 });
  });
});

describe('12. ID sequences and links are preserved', () => {
  it('the dev schema push is told about all three sequences, so it cannot drop them', async () => {
    const schema = await idSequenceSchemaHook({ schema: { enums: {}, relations: {}, tables: {} } } as never);
    assert.deepEqual(
      Object.keys(schema.enums as object).sort(),
      ['rer_listing_id_seq', 'rer_project_id_seq', 'rer_property_id_seq'],
    );
    assert.equal(RER_LISTING_ID_SEQUENCE, 'rer_listing_id_seq');
  });

  it('the migration planner never reads or advances an ID sequence', () => {
    // It is a pure function of the property and its listings: no payload, no
    // SQL, so there is nothing for it to advance.
    const plan = planListingFromLegacyProperty({ id: 5, propertyId: 'RER-00005', slug: 's', purpose: 'sale', status: 'draft' });
    assert.equal(plan.listing?.property, 5, 'the listing links to the existing property row by its existing id');
  });

  it('a property\'s ID and slug are never touched by the roll-up write', async () => {
    const payload = fakePayload({
      properties: [{ ...UNITED_TOWER, status: 'draft' }],
      listings: [listingRow()],
    });
    await syncPropertyRollup({ payload: payload as never, propertyId: 1 });
    assert.deepEqual(Object.keys(payload.writes[0].data).sort(), ['isTenanted', 'status']);
    assert.equal(payload.store.properties[0].propertyId, 'RER-00001');
    assert.equal(payload.store.properties[0].slug, UNITED_TOWER.slug);
  });
});

// --- admin ---------------------------------------------------------------------------

describe('admin summaries', () => {
  it('orders a property\'s listings Sale, Rent, Lease and formats each price', () => {
    const summaries = sortListingSummaries([
      summariseListing({ id: 2, listingId: 'RER-L-00002', transactionType: 'rent', status: 'available', pricing: { rentAmount: 75_000 } }),
      summariseListing({ id: 1, listingId: 'RER-L-00001', transactionType: 'sale', status: 'available', pricing: { price: 22_500_000 } }),
    ]);
    assert.deepEqual(summaries.map((s) => `${s.typeLabel} ${s.displayPrice}`), ['Sale ₹2.25 Cr', 'Rent ₹75,000 / month']);
  });

  it('the console checks price against listings, not properties', () => {
    const price = ATTENTION_CHECKS.find((check) => check.key === 'listing-price');
    assert.equal(price?.collection, 'listings');
    assert.ok(!ATTENTION_CHECKS.some((check) => check.key === 'property-price'));
    assert.ok(
      ATTENTION_CHECKS.filter((c) => c.key.startsWith('property-rented')).every((c) => JSON.stringify(c.where).includes('isTenanted')),
      'tenancy checks key off isTenanted, so a live sale never hides a tenancy',
    );
  });

  it('Properties and Listings share one Listings admin group and the property carries a join to its listings', () => {
    const flat = (Properties.fields as unknown as Row[]).flatMap((f) => (f.type === 'tabs' ? f.tabs.flatMap((t: Row) => t.fields) : [f]));
    const join = flat.find((f) => f.type === 'join');
    assert.equal(join?.collection, 'listings');
    assert.equal(join?.on, 'property');
    assert.equal(Listings.admin?.group, 'Listings');
  });
});

// --- hardening: database-level duplicate rule ---------------------------------------

describe('the partial unique index matches the business rule exactly', () => {
  it('constrains active statuses only: draft, available, under-offer', () => {
    assert.deepEqual([...ACTIVE_LISTING_STATUSES], ['draft', 'available', 'under-offer']);
    for (const status of ACTIVE_LISTING_STATUSES) {
      assert.ok(ACTIVE_LISTING_INDEX_WHERE.includes(`'${status}'::enum_listings_status`), status);
    }
  });

  it('never constrains closed listings (sold, rented, withdrawn are history)', () => {
    for (const status of CLOSED_LISTING_STATUSES) {
      assert.ok(!ACTIVE_LISTING_INDEX_WHERE.includes(`'${status}'`), status);
    }
  });

  it('has a stable, recognisable name', () => {
    assert.equal(ACTIVE_LISTING_INDEX, 'listings_one_active_per_type_idx');
  });
});

describe('a duplicate rejected by the database reads as an explanation', () => {
  const dbError = { data: { errors: [{ message: 'Value must be unique', path: 'transactionType' }] }, message: 'The following field is invalid: transactionType' };

  it('recognises the uniqueness error Payload raises for the index', () => {
    assert.equal(isDuplicateActiveListingError(dbError.data.errors), true);
    assert.equal(isDuplicateActiveListingError([{ message: 'Value must be unique', path: 'slug' }]), false);
    assert.equal(isDuplicateActiveListingError([{ message: 'Required', path: 'transactionType' }]), false);
  });

  it('rewrites the REST response and leaves other errors alone', async () => {
    const rewritten = (await explainDuplicateListingError({ result: { errors: [dbError] } } as never)) as { response: Row; status: number };
    assert.equal(rewritten.status, 400);
    assert.equal(rewritten.response.errors[0].message, DUPLICATE_ACTIVE_LISTING_MESSAGE);
    assert.equal(rewritten.response.errors[0].data.errors[0].message, DUPLICATE_ACTIVE_LISTING_MESSAGE);
    assert.equal(rewritten.response.errors[0].data.errors[0].path, 'transactionType');

    const other = { errors: [{ data: { errors: [{ message: 'Required', path: 'property' }] }, message: 'x' }] };
    assert.equal(await explainDuplicateListingError({ result: other } as never), undefined);
  });
});

// --- hardening: property + first listing in one save -------------------------------

describe('creating a property with its first listing', () => {
  it('builds nothing when no transaction type is chosen', () => {
    assert.equal(buildInitialListing(undefined), null);
    assert.equal(buildInitialListing({}), null);
    assert.equal(buildInitialListing({ transactionType: 'lease' }), null, 'lease is added from the Listings tab');
  });

  it('keeps only the fields of the chosen type', () => {
    const sale = buildInitialListing({ transactionType: 'sale', status: 'available', price: 22_500_000, rentAmount: 75_000, securityDeposit: 1 })!;
    assert.deepEqual(sale.pricing, { priceOnRequest: false, negotiable: false, price: 22_500_000 });
    assert.equal(sale.status, 'available');

    const rent = buildInitialListing({ transactionType: 'rent', rentAmount: 75_000, securityDeposit: 300_000, price: 9 })!;
    assert.equal(rent.pricing.price, undefined);
    assert.equal(rent.pricing.rentAmount, 75_000);
    assert.equal(rent.pricing.securityDeposit, 300_000);
    assert.equal(rent.status, 'draft', 'draft unless explicitly made available');
  });

  const req = { t: (key: string) => key } as never;

  it('rejects an invalid first listing before anything is written, on the right form field', () => {
    const context: Row = {};
    assert.throws(
      () => validateInitialListing({ data: { initialListing: { transactionType: 'sale', status: 'available' } }, operation: 'create', req, context } as never),
      (error: { data?: { errors?: Array<{ path: string }> } }) => error.data?.errors?.[0]?.path === 'initialListing.price',
    );
    assert.equal(context[INITIAL_LISTING_CONTEXT_KEY], undefined);
  });

  it('passes a valid first listing to the afterChange hook through the request context', () => {
    const context: Row = {};
    validateInitialListing({ data: { initialListing: { transactionType: 'rent', status: 'available', rentAmount: 75_000 } }, operation: 'create', req, context } as never);
    assert.equal((context[INITIAL_LISTING_CONTEXT_KEY] as Row).transactionType, 'rent');
  });

  it('does nothing on update — later listings come from the Listings tab', () => {
    const context: Row = {};
    validateInitialListing({ data: { initialListing: { transactionType: 'sale', status: 'available' } }, operation: 'update', req, context } as never);
    assert.equal(context[INITIAL_LISTING_CONTEXT_KEY], undefined);
  });

  it('creates the listing for the new property in the same request, exactly once', async () => {
    const calls: Row[] = [];
    const context: Row = { [INITIAL_LISTING_CONTEXT_KEY]: buildInitialListing({ transactionType: 'sale', price: 5 }) };
    const fakeReq = { user: { id: 1 }, payload: { create: async (args: Row) => { calls.push(args); return {}; } } };

    await createInitialListing({ doc: { id: 77 }, operation: 'create', req: fakeReq, context } as never);
    await createInitialListing({ doc: { id: 77 }, operation: 'create', req: fakeReq, context } as never);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].collection, 'listings');
    assert.equal((calls[0].data as Row).property, 77);
    assert.equal(calls[0].req, fakeReq, 'shares the transaction of the property save');
    assert.equal(calls[0].overrideAccess, false, 'a signed-in editor needs listing create permission as well');
  });

  it('a create failure propagates, so Payload rolls the property back', async () => {
    const context: Row = { [INITIAL_LISTING_CONTEXT_KEY]: buildInitialListing({ transactionType: 'sale', price: 5 }) };
    const fakeReq = { user: null, payload: { create: async () => { throw new Error('insert failed'); } } };
    await assert.rejects(createInitialListing({ doc: { id: 1 }, operation: 'create', req: fakeReq, context } as never), /insert failed/);
  });

  it('the group is create-only and never stored', () => {
    const overview = (Properties.fields as unknown as Row[]).find((f) => f.type === 'tabs').tabs[0].fields as Row[];
    const group = overview.find((f) => f.name === 'initialListing')!;
    assert.equal(group.virtual, true);
    assert.equal(group.admin.readOnly, false, 'Payload makes virtual fields read-only unless this is explicit');
    assert.equal(group.admin.condition({}, {}, { operation: 'create' }), true);
    assert.equal(group.admin.condition({}, {}, { operation: 'update' }), false);
  });
});

// --- hardening: never touch the live database by accident ---------------------------

describe('database safety guards', () => {
  const live = 'postgresql://user:pw@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';
  const local = 'postgresql://rer:rer@127.0.0.1:54329/rer_test';

  it('only this machine counts as local', () => {
    assert.equal(isLocalDatabaseUrl(local), true);
    assert.equal(isLocalDatabaseUrl('postgres://u@localhost/x'), true);
    assert.equal(isLocalDatabaseUrl(live), false);
    assert.equal(isLocalDatabaseUrl(undefined), false);
    assert.equal(isLocalDatabaseUrl('not a url'), false);
  });

  it('the dev schema push never reaches a remote database unless explicitly allowed', () => {
    assert.equal(schemaPushDecision({ nodeEnv: 'development', databaseUrl: local, allowLiveSchemaPush: undefined }).allowed, true);
    assert.equal(schemaPushDecision({ nodeEnv: 'development', databaseUrl: live, allowLiveSchemaPush: undefined }).allowed, false);
    assert.equal(schemaPushDecision({ nodeEnv: undefined, databaseUrl: live, allowLiveSchemaPush: '1' }).allowed, false, 'only the literal "true"');
    assert.equal(schemaPushDecision({ nodeEnv: 'development', databaseUrl: live, allowLiveSchemaPush: 'true' }).allowed, true);
    assert.equal(schemaPushDecision({ nodeEnv: 'production', databaseUrl: local, allowLiveSchemaPush: 'true' }).allowed, false);
  });

  it('write scripts need the target host confirmed for any remote database', () => {
    assert.equal(writeTargetError({ databaseUrl: local, confirmedHost: undefined }), null);
    assert.match(String(writeTargetError({ databaseUrl: live, confirmedHost: undefined })), /RER_CONFIRM_DATABASE_HOST=aws-0-ap-south-1\.pooler\.supabase\.com/);
    assert.notEqual(writeTargetError({ databaseUrl: live, confirmedHost: 'other.host' }), null);
    assert.equal(writeTargetError({ databaseUrl: live, confirmedHost: 'aws-0-ap-south-1.pooler.supabase.com' }), null);
  });
});
