import { sql } from '@payloadcms/db-postgres';
import {
  ALLOW_INCOMPLETE_PRICING,
  ALLOW_LEGACY_SLUG,
} from '../collections/hooks/validateListing';
import {
  planListingFromLegacyProperty,
  summarisePlans,
  type LegacyPropertyInput,
  type ListingMigrationPlan,
} from '../lib/listings/legacy';
import { isMissingRelationError } from '../collections/hooks/allocateIdSequence';
import { writeTargetError } from '../lib/databaseSafety';
import { getPayloadClient } from '../lib/payload';

/**
 * One-time, repeatable migration: gives every pre-existing Property the Listing
 * its single-transaction record implied.
 *
 * Before listings, a property WAS one transaction: `purpose`, `status`,
 * `pricing` and `tags` described the sale, rental or lease. This creates one
 * listing per property from those fields, so the website, console and admin keep
 * showing exactly what they showed.
 *
 *  - **Expand-only.** It COPIES. The legacy `purpose`, `status`, `pricing` and
 *    `tags` stay on the property untouched; nothing is moved, cleared or
 *    deleted, and no property ID, slug, media or relationship is changed.
 *  - **URLs preserved.** The listing takes the property's slug verbatim.
 *  - **Idempotent.** A property that already has a listing of the same
 *    transaction type is skipped. Re-running (dry or apply) cannot duplicate.
 *  - **Explicit about odd data.** Anything that cannot be carried across safely
 *    is reported with the exact reason and left alone; anything carried across
 *    despite being odd (a live listing with no price) is reported as a warning.
 *  - **Sequences untouched.** Property IDs are not re-issued. The Listing ID
 *    sequence advances by one per created listing, in Property ID order.
 *
 * DRY RUN unless LISTING_MIGRATE_APPLY is set:
 *
 *   npx payload run scripts/migrate-property-listings.ts
 *   LISTING_MIGRATE_APPLY=1 npx payload run scripts/migrate-property-listings.ts
 *
 * The `listings` table must exist before APPLY. It is created by the same
 * schema push every collection here reaches the database through (start the app
 * once with the new code); a dry run works either way and says which it found.
 *
 * APPLY against any non-local database also needs
 * RER_CONFIRM_DATABASE_HOST=<the host in DATABASE_URL> (lib/databaseSafety.ts),
 * so a stale shell variable cannot point a write at the wrong database.
 *
 * Exit code is non-zero if any property could not be migrated.
 */

type PropertyRow = LegacyPropertyInput & { propertyId?: string | null };

function truthy(name: string): boolean {
  return ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase());
}

async function readSequence(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  name: string,
): Promise<string> {
  try {
    const result = await payload.db.drizzle.execute(
      sql.raw(`SELECT last_value, is_called FROM ${name}`),
    );
    const rows = Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? []);
    const row = rows[0] as { last_value?: unknown; is_called?: unknown } | undefined;
    return row ? `${row.last_value}${row.is_called ? '' : ' (not yet called)'}` : 'unavailable';
  } catch {
    return 'does not exist';
  }
}

async function main() {
  const apply = truthy('LISTING_MIGRATE_APPLY');

  if (apply) {
    const refusal = writeTargetError({
      databaseUrl: process.env.DATABASE_URL,
      confirmedHost: process.env.RER_CONFIRM_DATABASE_HOST,
    });
    if (refusal) {
      console.error(refusal);
      process.exitCode = 1;
      return;
    }
  }

  const payload = await getPayloadClient();

  console.log(
    apply
      ? '\nMODE: APPLY — listings will be created.\n'
      : '\nMODE: DRY RUN — nothing is written. Re-run with LISTING_MIGRATE_APPLY=1 to apply.\n',
  );

  // ----------------------------------------------------------------- inputs
  const properties: PropertyRow[] = [];
  for (let page = 1; ; page += 1) {
    const result = await payload.find({
      collection: 'properties',
      depth: 0,
      limit: 100,
      page,
      sort: 'propertyId',
      overrideAccess: true,
    });
    properties.push(...(result.docs as unknown as PropertyRow[]));
    if (!result.hasNextPage) break;
  }

  let listingsTableExists = true;
  const listingsByProperty = new Map<string, Array<{ transactionType?: unknown; listingId?: string | null }>>();
  try {
    for (let page = 1; ; page += 1) {
      const result = await payload.find({
        collection: 'listings',
        depth: 0,
        limit: 200,
        page,
        overrideAccess: true,
      });
      for (const doc of result.docs) {
        const key = String(typeof doc.property === 'object' ? doc.property.id : doc.property);
        const list = listingsByProperty.get(key) ?? [];
        list.push(doc);
        listingsByProperty.set(key, list);
      }
      if (!result.hasNextPage) break;
    }
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    listingsTableExists = false;
  }

  console.log(`Properties found: ${properties.length}`);
  console.log(
    listingsTableExists
      ? `Existing listings: ${[...listingsByProperty.values()].reduce((n, l) => n + l.length, 0)}`
      : 'The listings table does not exist yet — treated as empty for this plan.',
  );

  if (apply && !listingsTableExists) {
    console.error(
      '\nCannot apply: the listings table does not exist. Start the app once with the new code so the schema push creates it, then re-run.',
    );
    process.exitCode = 1;
    await payload.destroy();
    return;
  }

  const sequencesBefore = {
    property: await readSequence(payload, 'rer_property_id_seq'),
    listing: await readSequence(payload, 'rer_listing_id_seq'),
  };

  // ------------------------------------------------------------------- plan
  const plans: ListingMigrationPlan[] = properties.map((property) =>
    planListingFromLegacyProperty(property, listingsByProperty.get(String(property.id)) ?? []),
  );

  for (const plan of plans) {
    const ref = plan.property.propertyId ?? String(plan.property.id);
    const symbol = plan.action === 'create' ? (apply ? '+' : '~') : plan.action === 'skip-existing' ? '=' : 'x';
    const detail =
      plan.action === 'create' && plan.listing
        ? `${apply ? 'creating' : 'would create'} ${plan.listing.transactionType}/${plan.listing.status} listing at /properties/${plan.listing.slug}`
        : plan.action === 'skip-existing'
          ? 'already has a listing of this transaction type — skipping'
          : 'NOT MIGRATED';
    console.log(`  ${symbol} ${ref} — ${detail}`);
    for (const issue of plan.issues) {
      console.log(`      ${issue.level === 'error' ? 'ERROR  ' : 'warning'} [${issue.code}] ${issue.message}`);
    }
  }

  const summary = summarisePlans(plans);
  console.log(
    `\nPLAN: ${summary.create} to create, ${summary.skipExisting} already migrated, ${summary.skipError} cannot be migrated, ${summary.warnings} warning(s).`,
  );

  if (!apply) {
    console.log('Dry run complete. Nothing was written.');
    await payload.destroy();
    process.exitCode = summary.skipError > 0 ? 1 : 0;
    return;
  }

  // ------------------------------------------------------------------ apply
  let created = 0;
  let failed = 0;

  for (const plan of plans) {
    if (plan.action !== 'create' || !plan.listing) continue;
    const ref = plan.property.propertyId ?? String(plan.property.id);

    try {
      const doc = await payload.create({
        collection: 'listings',
        data: plan.listing as never,
        overrideAccess: true,
        depth: 0,
        // Carry the original across even when it was incomplete; the report
        // above already flagged it. See validateListing.ts.
        context: { [ALLOW_INCOMPLETE_PRICING]: true, [ALLOW_LEGACY_SLUG]: true },
      });
      created += 1;
      console.log(`  + ${ref} -> ${doc.listingId} (${plan.listing.transactionType}, /properties/${doc.slug})`);
    } catch (error) {
      failed += 1;
      console.error(`  ! ${ref} — listing NOT created: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ----------------------------------------------------------------- verify
  const afterCount = await payload.count({ collection: 'listings', overrideAccess: true });
  const sequencesAfter = {
    property: await readSequence(payload, 'rer_property_id_seq'),
    listing: await readSequence(payload, 'rer_listing_id_seq'),
  };

  const unmigrated: string[] = [];
  for (const property of properties) {
    const found = await payload.count({
      collection: 'listings',
      where: { property: { equals: property.id } },
      overrideAccess: true,
    });
    if (found.totalDocs === 0) unmigrated.push(property.propertyId ?? String(property.id));
  }

  console.log(`\nSUMMARY: ${created} created, ${failed} failed, ${summary.skipExisting} already migrated, ${summary.skipError} skipped with errors.`);
  console.log(`Listings now in database: ${afterCount.totalDocs}`);
  console.log(`rer_property_id_seq: ${sequencesBefore.property} -> ${sequencesAfter.property} (must be unchanged)`);
  console.log(`rer_listing_id_seq:  ${sequencesBefore.listing} -> ${sequencesAfter.listing}`);
  console.log(
    unmigrated.length === 0
      ? 'Every property now has at least one listing.'
      : `Properties still without a listing: ${unmigrated.join(', ')}`,
  );

  process.exitCode = failed > 0 || summary.skipError > 0 || sequencesBefore.property !== sequencesAfter.property ? 1 : 0;
  await payload.destroy();
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
