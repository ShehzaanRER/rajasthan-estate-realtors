import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook, Payload } from 'payload';
import { allocateIdSequence } from './allocateIdSequence';
import { syncIdSequence } from './syncIdSequence';

/**
 * PostgreSQL sequence used to allocate unique RER Project Number values.
 * Created explicitly on Payload init (CREATE SEQUENCE IF NOT EXISTS).
 * nextval is atomic and does not depend on Payload's create transaction,
 * so concurrent project creation can never allocate the same number.
 *
 * Mirrors the propertyId sequence in assignPropertyId.ts. Kept as a
 * separate sequence (not shared with rer_property_id_seq) so property and
 * project numbering are independent, permanent series.
 */
export const RER_PROJECT_ID_SEQUENCE = 'rer_project_id_seq';

export async function ensureProjectIdSequence(payload: Payload): Promise<void> {
  await payload.db.drizzle.execute(
    sql.raw(
      `CREATE SEQUENCE IF NOT EXISTS ${RER_PROJECT_ID_SEQUENCE} AS BIGINT INCREMENT BY 1 MINVALUE 1 START WITH 1`,
    ),
  );

  await syncIdSequence({
    payload,
    sequence: RER_PROJECT_ID_SEQUENCE,
    collection: 'projects',
    field: 'projectId',
  });
}

export function formatProjectId(n: number): string {
  return `RER-P-${String(n).padStart(4, '0')}`;
}


/**
 * Assigns the permanent RER Project Number on create only. Never
 * regenerated or editable afterwards — renaming, re-slugging or
 * repricing a project must never change this identifier. This is
 * distinct from the RERA Registration Number, which is supplied by the
 * builder/authority and stored as plain admin-entered text.
 */
export const assignProjectId: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation === 'update') {
    data.projectId = originalDoc?.projectId ?? undefined;
    return data;
  }

  if (operation !== 'create') {
    return data;
  }

  const next = await allocateIdSequence({
    payload: req.payload,
    sequence: RER_PROJECT_ID_SEQUENCE,
    label: 'RER Project Number',
    ensure: ensureProjectIdSequence,
  });
  data.projectId = formatProjectId(next);
  return data;
};
