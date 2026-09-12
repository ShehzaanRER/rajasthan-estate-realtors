import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ServiceException,
} from '@aws-sdk/client-s3';

/**
 * One-time (re-runnable) migration: uploads the existing local `media/`
 * files to the Supabase Storage bucket that Payload's S3 adapter
 * (payload.config.ts) now reads from, under their exact current filenames.
 *
 * Deliberately does NOT import `getPayloadClient`, `payload`, or anything
 * that opens a Postgres connection. This script only talks to the S3
 * endpoint. It never creates, updates, or reads a Media document — the 17
 * existing records already reference these exact filenames and need no
 * changes at all once the bytes exist at the same key.
 *
 * Idempotent: an object already present with a matching size is skipped.
 * An object present with a *different* size is reported and left alone —
 * this script never overwrites a pre-existing object of a different size,
 * so a second run (or a run after a partial first run) cannot corrupt or
 * duplicate anything.
 */

const MEDIA_DIR = path.resolve(process.cwd(), 'media');

const REQUIRED_ENV_VARS = [
  'S3_BUCKET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

function isNotFound(err: unknown): boolean {
  const e = err as Partial<S3ServiceException> | undefined;
  return e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404;
}

async function md5OfFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return createHash('md5').update(buffer).digest('hex');
}

async function main() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  const bucket = process.env.S3_BUCKET as string;

  // Mirrors the S3 client configuration in payload.config.ts exactly, so this
  // script and the running app always agree on how objects are addressed.
  const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: true,
  });

  const entries = await fs.readdir(MEDIA_DIR, { withFileTypes: true });
  const filenames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();

  console.log(`Found ${filenames.length} local file(s) in ${MEDIA_DIR}`);
  console.log(`Target bucket: ${bucket}`);
  console.log('');

  let uploaded = 0;
  let skipped = 0;
  let mismatched = 0;
  let failed = 0;

  for (const filename of filenames) {
    const filePath = path.join(MEDIA_DIR, filename);
    const stat = await fs.stat(filePath);

    try {
      const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: filename }));

      if (head.ContentLength === stat.size) {
        console.log(`SKIP      ${filename} (already present, ${stat.size} bytes, size matches)`);
        skipped += 1;
        continue;
      }

      console.log(
        `MISMATCH  ${filename} — local ${stat.size} bytes, remote ${head.ContentLength} bytes. NOT overwritten.`,
      );
      mismatched += 1;
      continue;
    } catch (err) {
      if (!isNotFound(err)) {
        console.error(`ERROR     ${filename} — HeadObject failed: ${(err as Error).message}`);
        failed += 1;
        continue;
      }
      // NotFound is the expected case for a file not yet migrated — fall through to upload.
    }

    try {
      const buffer = await fs.readFile(filePath);
      const localMd5 = await md5OfFile(filePath);

      const putResult = await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: buffer,
          ContentType: 'image/jpeg',
        }),
      );

      const remoteEtag = (putResult.ETag || '').replace(/"/g, '');
      const etagNote =
        remoteEtag && remoteEtag !== localMd5 ? ' [etag differs from local MD5 — provider-dependent, not treated as an error]' : '';

      console.log(`UPLOAD    ${filename} (${stat.size} bytes)${etagNote}`);
      uploaded += 1;
    } catch (err) {
      console.error(`ERROR     ${filename} — upload failed: ${(err as Error).message}`);
      failed += 1;
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`  Total local files : ${filenames.length}`);
  console.log(`  Uploaded          : ${uploaded}`);
  console.log(`  Skipped (present) : ${skipped}`);
  console.log(`  Mismatched        : ${mismatched}`);
  console.log(`  Failed            : ${failed}`);
  console.log('');
  console.log('Local media/ files were only read, never modified or deleted.');
  console.log('No Payload/Postgres connection was opened by this script.');

  if (mismatched > 0 || failed > 0) {
    console.error('Completed with mismatches and/or errors — see above. Exiting non-zero.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
