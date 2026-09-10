import { getPayloadClient } from '../lib/payload';
import { mapProperty } from '../lib/properties/mapProperty';

async function main() {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: 'properties',
    where: {
      slug: {
        equals: 'New1',
      },
    },
    depth: 2,
    limit: 1,
    overrideAccess: false,
  });

  const doc = result.docs[0];

  if (!doc) {
    console.log('Property not found');
    return;
  }

  console.log('\n========== RAW PROPERTY MEDIA (PUBLIC ACCESS) ==========\n');

  console.dir(
    {
      slug: doc.slug,
      title: doc.title,
      media: doc.media,
    },
    { depth: null }
  );

  console.log('\n========== MAPPED IMAGES (PUBLIC ACCESS) ==========\n');

  const mapped = mapProperty(doc);

  console.dir(mapped?.images ?? null, { depth: null });

  console.log('\n========== DONE ==========\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});