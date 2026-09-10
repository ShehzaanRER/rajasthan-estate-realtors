import fs from 'node:fs/promises';
import path from 'node:path';
import { getPayloadClient } from '../lib/payload';

/**
 * One-time (and re-runnable) migration utility: re-runs every existing Media
 * document through Payload's upload pipeline so it picks up the `imageSizes`
 * derivatives defined in collections/Media.ts. Only needed for files uploaded
 * before that config existed — new uploads generate sizes automatically.
 */
async function main() {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: 'media',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  console.log(`Found ${docs.length} media document(s).`);

  for (const doc of docs) {
    if (!doc.filename) {
      console.log(`Skipping id=${doc.id}: no filename on record.`);
      continue;
    }

    const filePath = path.resolve(process.cwd(), 'media', doc.filename);

    let data: Buffer;
    try {
      data = await fs.readFile(filePath);
    } catch (error) {
      console.log(`Skipping id=${doc.id} (${doc.filename}): file not readable on disk (${(error as Error).message}).`);
      continue;
    }

    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {},
      file: {
        data,
        mimetype: doc.mimeType || 'image/jpeg',
        name: doc.filename,
        size: data.byteLength,
      },
      overrideAccess: true,
    });

    console.log(`Regenerated sizes for id=${doc.id} (${doc.filename}, ${(data.byteLength / 1024 / 1024).toFixed(1)} MB original).`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
