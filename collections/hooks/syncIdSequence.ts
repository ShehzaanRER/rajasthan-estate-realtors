import { sql } from '@payloadcms/db-postgres';
import type { CollectionSlug, Payload } from 'payload';

/**
 * Advances an identifier sequence past the highest value already stored in a
 * collection.
 *
 * `CREATE SEQUENCE IF NOT EXISTS` alone is not enough: a database that already
 * holds records created before the sequence existed — or one restored from a
 * dump, where sequence state is not carried over — starts handing out
 * identifiers that are already taken, and every create then fails on the
 * unique constraint.
 *
 * Only ever moves the sequence forward, so it is safe to run on every init and
 * can never re-issue an identifier that has already been allocated.
 */
export async function syncIdSequence({
  payload,
  sequence,
  collection,
  field,
}: {
  payload: Payload;
  sequence: string;
  collection: CollectionSlug;
  field: string;
}): Promise<void> {
  const { docs } = await payload.find({
    collection,
    sort: `-${field}`,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  // Identifiers are zero-padded to a fixed width, so a descending text sort
  // also gives the numerically highest value.
  const stored = docs[0]?.[field as keyof (typeof docs)[number]];
  const highest = Number(String(stored ?? '').replace(/\D/g, '')) || 0;

  if (highest < 1) {
    return;
  }

  await payload.db.drizzle.execute(
    sql.raw(
      `SELECT setval('${sequence}', GREATEST(${highest}, (SELECT CASE WHEN is_called THEN last_value ELSE 1 END FROM ${sequence})), true)`,
    ),
  );
}
