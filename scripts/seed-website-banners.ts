import { getPayloadClient } from '../lib/payload';
import { placementsToSeed, seedRecordFor } from '../lib/website-banners/seed';

/**
 * One-time setup for the Website Banners collection
 * (collections/WebsiteBanners.ts): creates one **draft** record per placement
 * that has no record yet, pre-filled with the copy the site shows today.
 *
 * Nothing it creates is visible on the website. The records are drafts, they
 * carry no images, and the website keeps rendering its built-in design for a
 * placement until an administrator publishes that placement's record. The
 * homepage hero and Our Story image cannot be published at all until a
 * desktop image is chosen.
 *
 * Create-only and safe to re-run: a placement that already has a record — in
 * any state — is skipped, so it never duplicates a record and never touches an
 * administrator's edits. It writes no Media relationships and changes no
 * Media, Property or Project record. The unique index on `placement` backs this
 * up if two runs ever overlap.
 *
 * DRY RUN unless SEED_WEBSITE_BANNERS_APPLY is set:
 *
 *   npx payload run scripts/seed-website-banners.ts
 *   SEED_WEBSITE_BANNERS_APPLY=1 npx payload run scripts/seed-website-banners.ts
 *
 * Requires the `website_banners` table, which the schema push of `next dev`
 * creates (see docs/CLAUDE/DECISIONS.md).
 */

function parseOptions() {
  const truthy = (name: string) => ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase());
  return { apply: truthy('SEED_WEBSITE_BANNERS_APPLY') };
}

async function main() {
  const { apply } = parseOptions();
  const payload = await getPayloadClient();

  console.log(
    apply
      ? '\nMODE: APPLY — writes will be committed.\n'
      : '\nMODE: DRY RUN — re-run with SEED_WEBSITE_BANNERS_APPLY=1 to commit.\n',
  );

  // Every record, drafts included: a never-published draft is still a row of
  // the main table, and still owns its placement.
  const { docs } = await payload.find({
    collection: 'website-banners',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { placement: true },
  });

  const existing = docs.map((doc) => doc.placement);
  const missing = placementsToSeed(existing);

  console.log(`Existing records: ${existing.length ? existing.join(', ') : 'none'}`);
  console.log(`To create as drafts: ${missing.length ? missing.join(', ') : 'none'}\n`);

  let created = 0;

  for (const placement of missing) {
    const data = seedRecordFor(placement);

    if (!apply) {
      console.log(`  would create draft "${data.name}" (${placement})`);
      continue;
    }

    try {
      await payload.create({
        collection: 'website-banners',
        data,
        draft: true,
        overrideAccess: true,
        depth: 0,
        // A draft changes nothing public, and there is no Next request here to
        // revalidate from.
        context: { disableRevalidate: true },
      });
      created += 1;
      console.log(`  created draft "${data.name}" (${placement})`);
    } catch (error) {
      // Most likely the unique index: another run created it first.
      console.warn(`  skipped ${placement}: ${(error as Error).message}`);
    }
  }

  console.log(
    apply
      ? `\nDone. ${created} draft record(s) created, ${existing.length} left untouched.`
      : '\nDry run complete. Nothing was written.',
  );

  await payload.destroy();
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
