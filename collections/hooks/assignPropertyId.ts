import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook, Payload } from 'payload';
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

function formatPropertyId(n: number): string {
  return `RER-${String(n).padStart(5, '0')}`;
}

function parseNextval(result: unknown): number {
  const rows = Array.isArray(result)
    ? result
    : (result as { rows?: Record<string, unknown>[] })?.rows;
  const first = rows?.[0] as Record<string, unknown> | undefined;
  const raw = first?.nextval ?? (first ? Object.values(first)[0] : undefined);
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Failed to allocate the next RER Property ID from PostgreSQL sequence.');
  }
  return n;
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

  const result = await req.payload.db.drizzle.execute(
    sql.raw(`SELECT nextval('${RER_PROPERTY_ID_SEQUENCE}')`),
  );
  data.propertyId = formatPropertyId(parseNextval(result));
  return data;
};
