import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook, Payload } from 'payload';
import { allocateIdSequence, isMissingRelationError } from './allocateIdSequence';
import { syncIdSequence } from './syncIdSequence';

/**
 * PostgreSQL sequence behind the RER Listing ID (`RER-L-00001`).
 *
 * A third permanent series beside `rer_property_id_seq` (`RER-00001`) and
 * `rer_project_id_seq` (`RER-P-0001`). It is deliberately separate: the
 * Property ID names the physical unit and never changes, while a Listing ID
 * names one transaction on that unit, so a property with a sale and a rental
 * has one Property ID and two Listing IDs. Same mechanics as the other two —
 * atomic `nextval`, created on init, declared to Drizzle in
 * `idSequenceSchema.ts` so the dev schema push keeps it.
 */
export const RER_LISTING_ID_SEQUENCE = 'rer_listing_id_seq';

export async function ensureListingIdSequence(payload: Payload): Promise<void> {
  await payload.db.drizzle.execute(
    sql.raw(
      `CREATE SEQUENCE IF NOT EXISTS ${RER_LISTING_ID_SEQUENCE} AS BIGINT INCREMENT BY 1 MINVALUE 1 START WITH 1`,
    ),
  );

  try {
    await syncIdSequence({
      payload,
      sequence: RER_LISTING_ID_SEQUENCE,
      collection: 'listings',
      field: 'listingId',
    });
  } catch (error) {
    // The `listings` table is created by the schema push. Until it exists
    // there is nothing stored to sync past, and failing here would stop the
    // whole app booting — including the push that would create the table.
    if (!isMissingRelationError(error)) {
      throw error;
    }
    payload.logger?.warn(
      'The listings table does not exist yet; skipped syncing rer_listing_id_seq. It syncs on the next boot once the schema is in place.',
    );
  }
}

export function formatListingId(n: number): string {
  return `RER-L-${String(n).padStart(5, '0')}`;
}

/** Allocates the permanent Listing ID on create only; never rewritten on update. */
export const assignListingId: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation === 'update') {
    data.listingId = originalDoc?.listingId ?? undefined;
    return data;
  }

  if (operation !== 'create') {
    return data;
  }

  const next = await allocateIdSequence({
    payload: req.payload,
    sequence: RER_LISTING_ID_SEQUENCE,
    label: 'RER Listing ID',
    ensure: ensureListingIdSequence,
  });
  data.listingId = formatListingId(next);
  return data;
};
