import { getPayloadClient } from '../lib/payload';
import type { Property } from '../payload-types';

/**
 * One-time migration: copies each property's existing flat `rentDetails`
 * (legacy, hidden — see collections/Properties.ts) into the first entry of
 * the new `rentHistory` array, so nothing already recorded is lost when
 * staff start using Tenancy History going forward.
 *
 * Never touches, clears, or deletes `rentDetails` — it stays exactly as it
 * is, hidden, as the permanent backup of what this script read from.
 *
 * This is a permanent, keep-in-repo migration (same category as
 * regenerate-media-sizes.ts), not a throwaway script — it documents how the
 * one pre-existing rental record on this project was carried forward, and
 * remains safe to run again against a restored/staging database.
 *
 * DRY RUN unless RENT_HISTORY_MIGRATE_APPLY is set:
 *
 *   npx payload run scripts/migrate-rent-history.ts
 *   RENT_HISTORY_MIGRATE_APPLY=1 npx payload run scripts/migrate-rent-history.ts
 *
 * Idempotent: a property whose `rentHistory` already has at least one entry
 * is skipped, so re-running (in apply mode or not) never creates duplicate
 * history entries.
 */

const RENT_DETAILS_FIELDS = [
  'licenseeName',
  'licenseeContactNumber',
  'monthlyRent',
  'securityDeposit',
  'agreementStartDate',
  'agreementTermMonths',
  'agreementEndDate',
  'agreementTerm',
  'rentalSource',
  'agentName',
  'agentContactNumber',
  'rentalNotes',
] as const;

function parseOptions() {
  const truthy = (name: string) =>
    ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase());

  return { apply: truthy('RENT_HISTORY_MIGRATE_APPLY') };
}

async function main() {
  const { apply } = parseOptions();
  const payload = await getPayloadClient();

  console.log(
    apply
      ? '\nMODE: APPLY — writes will be committed.\n'
      : '\nMODE: DRY RUN — re-run with RENT_HISTORY_MIGRATE_APPLY=1 to commit.\n',
  );

  const { docs } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  let migrated = 0;
  let skippedEmpty = 0;
  let skippedAlready = 0;

  for (const doc of docs as Property[]) {
    const rentDetails = doc.rentDetails;
    const existingHistory = doc.rentHistory;
    const label = doc.propertyId ?? String(doc.id);

    if (!rentDetails || !String(rentDetails.licenseeName ?? '').trim()) {
      skippedEmpty += 1;
      continue;
    }

    if (Array.isArray(existingHistory) && existingHistory.length > 0) {
      skippedAlready += 1;
      console.log(`  = ${label} — rentHistory already populated, skipping`);
      continue;
    }

    const row = Object.fromEntries(
      RENT_DETAILS_FIELDS.map((field) => [field, rentDetails[field] ?? null]),
    );

    console.log(
      `  ${apply ? '+' : '~'} ${label} — ${apply ? 'migrating' : 'would migrate'} "${rentDetails.licenseeName}"`,
    );

    if (apply) {
      await payload.update({
        collection: 'properties',
        id: doc.id,
        data: { rentHistory: [row] },
        overrideAccess: true,
        depth: 0,
      });
    }

    migrated += 1;
  }

  console.log(
    `\nSUMMARY: ${migrated} ${apply ? 'migrated' : 'would migrate'}, ${skippedAlready} already populated, ${skippedEmpty} had no rentDetails.`,
  );

  if (!apply) {
    console.log('Dry run complete. Nothing was written.');
  }

  await payload.destroy();
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
