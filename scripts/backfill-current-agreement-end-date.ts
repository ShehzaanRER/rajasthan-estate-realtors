import { getPayloadClient } from '../lib/payload';
import { calculateAgreementEndDate } from '../lib/properties/agreementDates';
import type { Property } from '../payload-types';

/**
 * One-time backfill for `currentAgreementEndDate` (see collections/Properties.ts)
 * on properties that existed before that field did. Unlike a field with a
 * static `defaultValue`, a hook-computed field is never backfilled by
 * Postgres's own schema push — new rows get it on their next save, but an
 * existing row stays `null` until something re-saves it. This script does
 * that one re-save, using the exact same computation as the field's own
 * `beforeChange` hook (recomputed from the last Tenancy History entry's
 * start date + term, not copied from anywhere else).
 *
 * Permanent, keep-in-repo (same category as migrate-rent-history.ts) —
 * remains safe to run again against a restored/staging database, or after
 * a future bulk import that adds properties directly.
 *
 * DRY RUN unless BACKFILL_AGREEMENT_END_DATE_APPLY is set:
 *
 *   npx payload run scripts/backfill-current-agreement-end-date.ts
 *   BACKFILL_AGREEMENT_END_DATE_APPLY=1 npx payload run scripts/backfill-current-agreement-end-date.ts
 *
 * Idempotent: always recomputes and compares against the stored value: a
 * property whose stored value already matches is skipped, and updating a
 * property with correct data twice never changes anything the second time.
 */

function parseOptions() {
  const truthy = (name: string) => ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase());
  return { apply: truthy('BACKFILL_AGREEMENT_END_DATE_APPLY') };
}

async function main() {
  const { apply } = parseOptions();
  const payload = await getPayloadClient();

  console.log(
    apply
      ? '\nMODE: APPLY — writes will be committed.\n'
      : '\nMODE: DRY RUN — re-run with BACKFILL_AGREEMENT_END_DATE_APPLY=1 to commit.\n',
  );

  const { docs } = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  });

  let updated = 0;
  let alreadyCorrect = 0;
  let noHistory = 0;

  for (const doc of docs as Property[]) {
    const label = doc.propertyId ?? String(doc.id);
    const history = Array.isArray(doc.rentHistory) ? doc.rentHistory : [];
    const last = history[history.length - 1];

    let computed: string | null = null;
    if (last) {
      const calculated = calculateAgreementEndDate({
        startDate: last.agreementStartDate ?? null,
        termMonths: last.agreementTermMonths ?? null,
        termDays: last.agreementTermDays ?? null,
      });
      computed = calculated ? calculated.toISOString() : (last.agreementEndDate ?? null);
    }

    if (!last) {
      noHistory += 1;
      continue;
    }

    const current = doc.currentAgreementEndDate ?? null;
    if (current === computed) {
      alreadyCorrect += 1;
      console.log(`  = ${label} — already correct (${computed ?? 'blank'})`);
      continue;
    }

    console.log(
      `  ${apply ? '+' : '~'} ${label} — ${apply ? 'setting' : 'would set'} currentAgreementEndDate: ${current ?? 'blank'} -> ${computed ?? 'blank'}`,
    );

    if (apply) {
      await payload.update({
        collection: 'properties',
        id: doc.id,
        data: { currentAgreementEndDate: computed },
        overrideAccess: true,
        depth: 0,
      });
    }

    updated += 1;
  }

  console.log(
    `\nSUMMARY: ${updated} ${apply ? 'updated' : 'would update'}, ${alreadyCorrect} already correct, ${noHistory} had no Tenancy History.`,
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
