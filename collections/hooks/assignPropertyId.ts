import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook, Payload } from 'payload';
import { allocateIdSequence } from './allocateIdSequence';
import { syncIdSequence } from './syncIdSequence';

/**
 * PostgreSQL sequence used to allocate unique RER Property ID numbers.
 * Created explicitly on Payload init (CREATE SEQUENCE IF NOT EXISTS).
 * nextval is atomic and does not depend on Payload's create transaction.
 */
export const RER_PROPERTY_ID_SEQUENCE = 'rer_property_id_seq';

export async function ensurePropertyIdSequence(payload: Payload): Promise<void> {
  await payload.db.drizzle.execute(
    sql.raw(
      `CREATE SEQUENCE IF NOT EXISTS ${RER_PROPERTY_ID_SEQUENCE} AS BIGINT INCREMENT BY 1 MINVALUE 1 START WITH 1`,
    ),
  );

  await syncIdSequence({
    payload,
    sequence: RER_PROPERTY_ID_SEQUENCE,
    collection: 'properties',
    field: 'propertyId',
  });
}

export function formatPropertyId(n: number): string {
  return `RER-${String(n).padStart(5, '0')}`;
}

export const assignPropertyId: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation === 'update') {
    data.propertyId = originalDoc?.propertyId ?? undefined;
    return data;
  }

  if (operation !== 'create') {
    return data;
  }

  const next = await allocateIdSequence({
    payload: req.payload,
    sequence: RER_PROPERTY_ID_SEQUENCE,
    label: 'RER Property ID',
    ensure: ensurePropertyIdSequence,
  });
  data.propertyId = formatPropertyId(next);
  return data;
};
