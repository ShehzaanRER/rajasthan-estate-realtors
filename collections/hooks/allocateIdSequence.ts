import { sql } from '@payloadcms/db-postgres';
import type { Payload } from 'payload';

/**
 * Shared `nextval()` allocation for the RER ID sequences
 * (`rer_property_id_seq`, `rer_project_id_seq`).
 *
 * The sequences are not Payload tables, so there is no Payload-managed
 * lifecycle that guarantees they exist at the moment a document is created.
 * They can vanish while the app is running (see `idSequenceSchema.ts`), which
 * surfaces as `Failed query: SELECT nextval('rer_project_id_seq')`.
 * Allocation therefore self-heals once: on "relation does not exist" it runs
 * the idempotent `ensure` step (CREATE SEQUENCE IF NOT EXISTS + sync past the
 * highest stored ID) and retries. Any other error is rethrown untouched.
 */

const UNDEFINED_TABLE = '42P01';

/** drizzle wraps the driver error in `cause`; walk the chain to find the code. */
export function isMissingRelationError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (candidate.code === UNDEFINED_TABLE) {
      return true;
    }
    if (typeof candidate.message === 'string' && /relation ".*" does not exist/i.test(candidate.message)) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

export function parseNextval(result: unknown, label: string): number {
  const rows = Array.isArray(result)
    ? result
    : (result as { rows?: Record<string, unknown>[] })?.rows;
  const first = rows?.[0] as Record<string, unknown> | undefined;
  const raw = first?.nextval ?? (first ? Object.values(first)[0] : undefined);
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Failed to allocate the next ${label} from PostgreSQL sequence.`);
  }
  return n;
}

export async function allocateIdSequence({
  payload,
  sequence,
  label,
  ensure,
}: {
  payload: Payload;
  sequence: string;
  /** Human name used in the error message, e.g. "RER Project Number". */
  label: string;
  ensure: (payload: Payload) => Promise<void>;
}): Promise<number> {
  const nextval = () => payload.db.drizzle.execute(sql.raw(`SELECT nextval('${sequence}')`));

  try {
    return parseNextval(await nextval(), label);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
    payload.logger?.warn(`Sequence ${sequence} is missing; recreating it and retrying.`);
    await ensure(payload);
    return parseNextval(await nextval(), label);
  }
}
