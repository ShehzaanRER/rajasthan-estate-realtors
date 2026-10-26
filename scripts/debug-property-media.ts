import { getPayloadClient } from '../lib/payload';
import { mapListing } from '../lib/properties/mapListing';

/**
 * Debug helper: shows the raw media of one public listing's property and what
 * the public mapper turns it into. The public site reads LISTINGS (a listing's
 * slug is the public URL), with the physical property — and its media —
 * populated, so that is what this inspects. Pass the slug as the first argument
 * (defaults to the original `New1` test record).
 */
async function main() {
  const slug = process.argv[2] ?? 'New1';
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: 'listings',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
    limit: 1,
    overrideAccess: false,
  });

  const doc = result.docs[0];

  if (!doc) {
    console.log(`Listing not found (or not public): ${slug}`);
    return;
  }

  const property = typeof doc.property === 'object' ? doc.property : null;

  console.log('\n========== RAW PROPERTY MEDIA (PUBLIC ACCESS) ==========\n');

  console.dir(
    {
      slug: doc.slug,
      listingId: doc.listingId,
      title: property?.title,
      media: property?.media,
    },
    { depth: null }
  );

  console.log('\n========== MAPPED IMAGES (PUBLIC ACCESS) ==========\n');

  const mapped = mapListing(doc);

  console.dir(mapped?.images ?? null, { depth: null });

  console.log('\n========== DONE ==========\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
