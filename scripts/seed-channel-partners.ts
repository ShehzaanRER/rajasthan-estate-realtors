import path from 'node:path';
import { getPayloadClient } from '../lib/payload';

/**
 * Seeds/updates the RER developer inventory in `channel-partners`.
 *
 * Idempotent and non-destructive: records are matched by `name`, existing ones
 * are updated in place (their ids are preserved), and nothing is ever deleted.
 * A partner that already has a logo keeps it unless a new file is supplied.
 *
 * Logo files are expected in LOGO_DIR, downloaded from each developer's own
 * website. A partner with no `logo` entry below is created without one.
 */

const LOGO_DIR = process.env.PARTNER_LOGO_DIR ?? '';

type PartnerSeed = {
  name: string;
  displayOrder: number;
  active: boolean;
  websiteUrl?: string;
  logo?: string;
};

const PARTNERS: PartnerSeed[] = [
  // --- Current RER partners: shown on the website ---
  { name: 'Lodha', displayOrder: 1, active: true, websiteUrl: 'https://www.lodhagroup.com', logo: 'lodha.svg' },
  { name: 'Crescent Group', displayOrder: 2, active: true, websiteUrl: 'https://crescentconstructions.co.in', logo: 'c2.png' },
  { name: 'Roswalt Realty', displayOrder: 3, active: true, websiteUrl: 'https://www.roswalt.com', logo: 'roswalt.webp' },
  { name: 'Paradigm Realty', displayOrder: 4, active: true, websiteUrl: 'https://paradigmrealty.co.in', logo: 'paradigm-b.svg' },
  // Website omitted: anandmodiinspirzz.com serves an empty page.
  { name: 'AMI', displayOrder: 5, active: true, logo: 'ami.svg' },
  { name: 'H. Rishabraj', displayOrder: 6, active: true, websiteUrl: 'https://www.hrishabraj.com', logo: 'rishabraj.png' },
  // Website omitted: only per-project microsites exist, no corporate site.
  { name: 'Chandiwala Group', displayOrder: 7, active: true, logo: 'chandiwala.png' },
  { name: 'Sunteck Realty', displayOrder: 8, active: true, websiteUrl: 'https://www.sunteckindia.com', logo: 'sunteck.svg' },

  // --- Internal reference only: not shown on the website ---
  { name: 'Arkade Developers', displayOrder: 9, active: false, websiteUrl: 'https://arkade.in', logo: 'arkade.webp' },
  // Logo omitted: only white-on-transparent variants are published, unusable on a white card.
  { name: 'Ashwin Sheth Group', displayOrder: 10, active: false, websiteUrl: 'https://www.ashwinshethgroup.com' },
  { name: 'Godrej Properties', displayOrder: 11, active: false, websiteUrl: 'https://www.godrejproperties.com', logo: 'godrej.svg' },
  { name: 'Rustomjee', displayOrder: 12, active: false, websiteUrl: 'https://www.rustomjee.com', logo: 'rustomjee.svg' },
  { name: 'Kalpataru', displayOrder: 13, active: false, websiteUrl: 'https://www.kalpataru.com', logo: 'kalpataru.svg' },
  { name: 'Runwal Realty', displayOrder: 14, active: false, websiteUrl: 'https://runwalrealty.com', logo: 'runwal.svg' },
  { name: 'The Wadhwa Group', displayOrder: 15, active: false, websiteUrl: 'https://www.thewadhwagroup.com', logo: 'wadhwa.png' },
  { name: 'DLF', displayOrder: 16, active: false, websiteUrl: 'https://www.dlf.in', logo: 'dlf.svg' },
];

/** Media filename for a logo, so re-running matches the same upload. */
function mediaFilename(partnerName: string, sourceFile: string): string {
  const slug = partnerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `partner-${slug}${path.extname(sourceFile)}`;
}

async function main() {
  const payload = await getPayloadClient();
  const results: string[] = [];

  for (const seed of PARTNERS) {
    let logoId: number | null = null;

    if (seed.logo) {
      const filename = mediaFilename(seed.name, seed.logo);
      const alt = `${seed.name} logo`;

      const existingMedia = await payload.find({
        collection: 'media',
        where: { filename: { equals: filename } },
        limit: 1,
      });

      if (existingMedia.docs[0]) {
        logoId = existingMedia.docs[0].id as number;
      } else {
        // filePath rather than a file buffer: Payload sniffs a buffer's bytes
        // and reads an SVG as application/xml, which the collection's image/*
        // restriction then rejects. Source files are already named
        // partner-<slug>.<ext>, so the stored filename is the one we want.
        const created = await payload.create({
          collection: 'media',
          data: { alt },
          filePath: path.join(LOGO_DIR, filename),
        });
        logoId = created.id as number;
      }
    }

    const existing = await payload.find({
      collection: 'channel-partners',
      where: { name: { equals: seed.name } },
      limit: 1,
    });

    const data = {
      name: seed.name,
      displayOrder: seed.displayOrder,
      active: seed.active,
      websiteUrl: seed.websiteUrl ?? null,
      ...(logoId ? { logo: logoId } : {}),
    };

    if (existing.docs[0]) {
      const doc = await payload.update({
        collection: 'channel-partners',
        id: existing.docs[0].id,
        data,
      });
      results.push(`updated | id=${doc.id} | ${doc.name} | order=${doc.displayOrder} | show=${doc.active} | logo=${doc.logo ? 'yes' : 'NONE'}`);
    } else {
      const doc = await payload.create({ collection: 'channel-partners', data });
      results.push(`created | id=${doc.id} | ${doc.name} | order=${doc.displayOrder} | show=${doc.active} | logo=${doc.logo ? 'yes' : 'NONE'}`);
    }
  }

  console.log(results.join('\n'));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
