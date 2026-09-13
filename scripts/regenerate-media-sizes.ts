import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, S3Client, type S3ServiceException } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getPayloadClient } from '../lib/payload';

/**
 * Re-runs existing Media documents through Payload's upload pipeline so they
 * pick up the current `imageSizes` derivatives from collections/Media.ts.
 * Needed whenever that config changes; new uploads get them automatically.
 *
 * Run it with Payload's own TS runner, which supplies the `@payload-config`
 * alias. It is a DRY RUN unless REGEN_APPLY is set:
 *
 *   npx payload run scripts/regenerate-media-sizes.ts
 *   REGEN_APPLY=1 npx payload run scripts/regenerate-media-sizes.ts
 *
 * Options (environment variables — see parseOptions for why not argv):
 *   REGEN_APPLY=1       actually write; without it nothing is committed
 *   REGEN_FORCE=1       redo documents whose derivatives are already current
 *   REGEN_LIMIT=<n>     process at most n documents
 *   REGEN_FILENAME=<f>  process only the document with this filename
 *
 * ---------------------------------------------------------------------------
 * Why this reads from S3
 *
 * The previous version read originals from the local `media/` directory. That
 * silently skipped any document whose file was not on this machine's disk —
 * at the time of writing, 5 of 22 records, and on a fresh clone or in CI all
 * 22, since `media/` is gitignored. Media lives in Supabase Storage: the
 * s3Storage plugin sets `disableLocalStorage: true`, so local files are
 * leftovers from before that migration, not the source of truth.
 *
 * Safety properties, in order of how much damage their absence would do:
 *
 * 1. Derivatives are never used as input. The S3 key for an original is
 *    exactly `doc.filename`; derivatives carry a `-WxH` suffix and a
 *    different extension. On top of that, every fetched buffer is decoded and
 *    its dimensions compared against `doc.width`/`doc.height` before it is
 *    allowed anywhere near the pipeline, so a mismatched or replaced object is
 *    reported and skipped rather than re-compressed into a new generation.
 *
 * 2. Originals are never renamed. `payload.update()` defaults
 *    `overwriteExistingFiles` to false, which sends the filename through
 *    getSafeFileName -> docWithFilenameExists. That query matches the document
 *    being updated, so Payload would treat the name as taken and write
 *    `IMG_8634-1-1.jpg` instead: a new S3 object, the real original orphaned
 *    under its old key, and every cached, indexed or shared URL broken.
 *    Passing `overwriteExistingFiles: true` keeps the key stable.
 *
 * 3. Originals are never altered. Payload re-PUTs the original bytes under the
 *    same key; we hand it back exactly what we fetched, and assert the SHA-256
 *    is unchanged afterwards. Content is identical, so the "original" is still
 *    the original.
 *
 * 4. Nothing is deleted. Derivative filenames encode their dimensions, so the
 *    previous generation (`-1600x1200.jpg`) is not overwritten by the new one
 *    (`-2400x1800.webp`) — it is left in the bucket. Those are reported at the
 *    end as orphan candidates for a human to remove deliberately.
 *
 * 5. One document cannot take down the run. Every record is isolated; failures
 *    are collected and printed, and the process exits non-zero if any occurred
 *    so a partial run is never mistaken for a clean one.
 * ---------------------------------------------------------------------------
 */

const REQUIRED_ENV_VARS = [
  'S3_BUCKET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

const LOCAL_MEDIA_DIR = path.resolve(process.cwd(), 'media');

type Outcome = 'regenerated' | 'would-regenerate' | 'skipped-current' | 'failed';

type Result = {
  id: number | string;
  filename: string;
  outcome: Outcome;
  detail: string;
};

/**
 * Options come from the environment rather than argv because `payload run`
 * does not forward either the script path or any arguments — inside the
 * script `process.argv` is just `[node, payload/bin.js]`, so a `--apply` flag
 * would be silently dropped and a dry run would look like a real one.
 */
function parseOptions() {
  const truthy = (name: string) => ['1', 'true', 'yes'].includes((process.env[name] ?? '').toLowerCase());

  const limitRaw = process.env.REGEN_LIMIT;
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  if (limitRaw !== undefined && (!Number.isFinite(limit) || (limit as number) < 1)) {
    throw new Error(`REGEN_LIMIT must be a positive integer, received "${limitRaw}"`);
  }

  return {
    apply: truthy('REGEN_APPLY'),
    force: truthy('REGEN_FORCE'),
    filename: process.env.REGEN_FILENAME || undefined,
    limit,
  };
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function isNotFound(error: unknown): boolean {
  const err = error as Partial<S3ServiceException> | undefined;
  return err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404;
}

function buildS3Client(): { client: S3Client; bucket: string } {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase Storage (S3) configuration: ${missing.join(', ')}. ` +
        'Originals live in the bucket, so this script cannot run without it.',
    );
  }

  return {
    bucket: process.env.S3_BUCKET as string,
    client: new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
    }),
  };
}

/**
 * Fetches the original for a document: bucket first, local disk only as a
 * fallback for the legacy pre-migration files. Returns null when neither has
 * it, so the caller can record a failure instead of guessing.
 */
async function readOriginal(
  s3: { client: S3Client; bucket: string },
  filename: string,
): Promise<{ buffer: Buffer; from: 's3' | 'local' } | null> {
  try {
    const object = await s3.client.send(
      new GetObjectCommand({ Bucket: s3.bucket, Key: filename }),
    );

    if (object.Body) {
      const bytes = await object.Body.transformToByteArray();
      return { buffer: Buffer.from(bytes), from: 's3' };
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  try {
    return { buffer: await fs.readFile(path.join(LOCAL_MEDIA_DIR, filename)), from: 'local' };
  } catch {
    return null;
  }
}

/**
 * Confirms the bytes we are about to feed back into the pipeline really are
 * the original and not some derivative that ended up at this key. Payload
 * recorded the original's dimensions at upload time, so they are the check.
 */
async function assertIsOriginal(
  buffer: Buffer,
  doc: { width?: number | null; height?: number | null },
): Promise<void> {
  const meta = await sharp(buffer).metadata();

  if (typeof doc.width !== 'number' || typeof doc.height !== 'number') {
    return;
  }

  // Payload stores post-rotation dimensions, so allow the EXIF-swapped pair.
  const matches =
    (meta.width === doc.width && meta.height === doc.height) ||
    (meta.width === doc.height && meta.height === doc.width);

  if (!matches) {
    throw new Error(
      `refusing to use this file as a source: it is ${meta.width}x${meta.height} but the ` +
        `record says the original is ${doc.width}x${doc.height}. The object at this key may ` +
        'have been replaced by a derivative.',
    );
  }
}

/** True when every configured size is already present in its current form. */
function isAlreadyCurrent(
  sizes: Record<string, { mimeType?: string | null; width?: number | null } | undefined> | undefined,
  expected: { name: string; width: number; mimeType: string }[],
  originalWidth: number | null | undefined,
): boolean {
  return expected.every(({ name, width, mimeType }) => {
    const size = sizes?.[name];

    if (!size?.width || size.mimeType !== mimeType) {
      return false;
    }

    // `withoutEnlargement` leaves originals narrower than the target at their
    // own width, so that is a legitimately current derivative too.
    return size.width === width || (typeof originalWidth === 'number' && size.width === originalWidth);
  });
}

async function main() {
  const args = parseOptions();
  const s3 = buildS3Client();
  const payload = await getPayloadClient();

  const imageSizes = payload.collections.media.config.upload.imageSizes ?? [];
  const expectedSizes = imageSizes.map((size) => ({
    name: size.name,
    width: size.width as number,
    mimeType: `image/${size.formatOptions?.format ?? 'jpeg'}`,
  }));

  console.log(
    args.apply
      ? '\nMODE: APPLY — media records and bucket objects will be written.\n'
      : '\nMODE: DRY RUN — nothing will be written. Re-run with REGEN_APPLY=1 to commit.\n',
  );
  console.log(
    'Target derivatives: ' +
      expectedSizes.map((s) => `${s.name}<=${s.width}px ${s.mimeType}`).join(', ') +
      '\n',
  );

  const { docs } = await payload.find({
    collection: 'media',
    limit: args.limit ?? 1000,
    depth: 0,
    overrideAccess: true,
    ...(args.filename ? { where: { filename: { equals: args.filename } } } : {}),
  });

  console.log(`Found ${docs.length} media document(s).\n`);

  const results: Result[] = [];
  const orphanCandidates: string[] = [];

  for (const doc of docs) {
    const filename = doc.filename;

    if (!filename) {
      results.push({
        id: doc.id,
        filename: '(none)',
        outcome: 'failed',
        detail: 'record has no filename',
      });
      continue;
    }

    try {
      if (!args.force && isAlreadyCurrent(doc.sizes, expectedSizes, doc.width)) {
        results.push({ id: doc.id, filename, outcome: 'skipped-current', detail: 'already current' });
        console.log(`  = ${filename} — already current, skipping`);
        continue;
      }

      const original = await readOriginal(s3, filename);

      if (!original) {
        throw new Error('original not found in the bucket or in local media/');
      }

      await assertIsOriginal(original.buffer, doc);

      // Derivative keys encode dimensions and format, so the previous
      // generation is not overwritten by the new one — record it for cleanup.
      for (const [, size] of Object.entries(doc.sizes ?? {})) {
        const existing = (size as { filename?: string | null } | undefined)?.filename;
        if (existing) {
          orphanCandidates.push(existing);
        }
      }

      const before = sha256(original.buffer);
      const mb = (original.buffer.byteLength / 1024 / 1024).toFixed(1);

      if (!args.apply) {
        results.push({
          id: doc.id,
          filename,
          outcome: 'would-regenerate',
          detail: `${mb} MB original from ${original.from}`,
        });
        console.log(`  ~ ${filename} — would regenerate from ${original.from} (${mb} MB original)`);
        continue;
      }

      const updated = await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: {
          data: original.buffer,
          mimetype: doc.mimeType || 'application/octet-stream',
          name: filename,
          size: original.buffer.byteLength,
        },
        // Without this Payload renames the file to avoid a collision with the
        // very document it is updating. See the header comment.
        overwriteExistingFiles: true,
        overrideAccess: true,
      });

      if (updated.filename !== filename) {
        throw new Error(
          `filename changed from "${filename}" to "${updated.filename}" — the original may now ` +
            'be orphaned under its old key. Investigate before re-running.',
        );
      }

      const after = await readOriginal(s3, filename);

      if (!after || sha256(after.buffer) !== before) {
        throw new Error('the original in the bucket changed during regeneration');
      }

      const written = Object.entries(updated.sizes ?? {})
        .map(([name, size]) => {
          const s = size as { width?: number | null; height?: number | null; filesize?: number | null };
          return s?.width ? `${name} ${s.width}x${s.height} ${Math.round((s.filesize ?? 0) / 1024)}KB` : null;
        })
        .filter(Boolean)
        .join(', ');

      results.push({ id: doc.id, filename, outcome: 'regenerated', detail: written });
      console.log(`  + ${filename} — ${written}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      results.push({ id: doc.id, filename, outcome: 'failed', detail });
      console.log(`  ! ${filename} — FAILED: ${detail}`);
    }
  }

  const count = (outcome: Outcome) => results.filter((r) => r.outcome === outcome).length;
  const failures = results.filter((r) => r.outcome === 'failed');

  console.log('\n──────────────── SUMMARY ────────────────');
  console.log(`  total documents:   ${results.length}`);
  console.log(`  regenerated:       ${count('regenerated')}`);
  console.log(`  would regenerate:  ${count('would-regenerate')}`);
  console.log(`  already current:   ${count('skipped-current')}`);
  console.log(`  failed:            ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nFAILURES:');
    for (const failure of failures) {
      console.log(`  - ${failure.filename} (id=${failure.id}): ${failure.detail}`);
    }
  }

  const orphans = [...new Set(orphanCandidates)];

  if (orphans.length > 0) {
    console.log(
      `\nORPHAN CANDIDATES (${orphans.length}) — superseded derivative objects still in the ` +
        'bucket. This script never deletes; remove them by hand once you are satisfied nothing ' +
        'links to them:',
    );
    for (const orphan of orphans) {
      console.log(`  - ${orphan}`);
    }
  }

  if (!args.apply) {
    console.log('\nDry run complete. Nothing was written. Re-run with REGEN_APPLY=1 to commit.');
  }

  return failures.length;
}

/**
 * Top-level await, not `main().then(...)`: `payload run` exits once the
 * module finishes evaluating, so a floating promise is abandoned mid-flight
 * and the script ends silently with status 0 having done nothing.
 *
 * Closing the pool explicitly, rather than calling `process.exit()`, is the
 * other half of that — `process.exit()` discards whatever is still sitting in
 * stdout's buffer when output is piped or redirected to a file.
 */
try {
  const failureCount = await main();
  process.exitCode = failureCount > 0 ? 1 : 0;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

await getPayloadClient()
  .then((payload) => payload.destroy())
  .catch(() => {});
