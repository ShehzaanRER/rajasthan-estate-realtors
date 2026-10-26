/**
 * Guards against touching the shared, live database by accident.
 *
 * RER's development and production use ONE Supabase database (see
 * docs/NEW-LAPTOP-SETUP.md), and `.env` points at it. Two things therefore act
 * on production the moment someone runs them locally:
 *
 *  1. `next dev` / `payload run`: Payload's dev schema push applies whatever the
 *     current branch's collections say — including drops, if an old branch is
 *     checked out after a schema has moved on.
 *  2. Write scripts (the listings migration).
 *
 * Pure functions, so the rules are unit-tested and read the same everywhere.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export function databaseHost(databaseUrl: string | undefined | null): string | null {
  if (!databaseUrl) {
    return null;
  }

  try {
    return new URL(databaseUrl).hostname || null;
  } catch {
    return null;
  }
}

/** True only for a database on this machine. Anything unparsable counts as remote. */
export function isLocalDatabaseUrl(databaseUrl: string | undefined | null): boolean {
  const host = databaseHost(databaseUrl);
  return host !== null && (LOCAL_HOSTS.has(host) || host.endsWith('.localhost'));
}

export type SchemaPushDecision = { allowed: boolean; reason: string };

/**
 * Whether Payload may run its dev schema push at boot.
 *
 * - Production never pushes (Payload's own rule; repeated here so the decision is
 *   explicit).
 * - A local database always may — that is what the push is for.
 * - Any other database (the live Supabase one) only with
 *   `RER_ALLOW_LIVE_SCHEMA_PUSH=true`, set deliberately for the single reviewed
 *   rollout step in docs/LISTINGS-ROLLOUT.md. Without it the app still starts
 *   against the live database; it just cannot change its schema.
 */
export function schemaPushDecision({
  nodeEnv,
  databaseUrl,
  allowLiveSchemaPush,
}: {
  nodeEnv: string | undefined;
  databaseUrl: string | undefined;
  allowLiveSchemaPush: string | undefined;
}): SchemaPushDecision {
  if (nodeEnv === 'production') {
    return { allowed: false, reason: 'production never pushes the schema' };
  }

  if (isLocalDatabaseUrl(databaseUrl)) {
    return { allowed: true, reason: 'local database' };
  }

  if (allowLiveSchemaPush === 'true') {
    return { allowed: true, reason: 'RER_ALLOW_LIVE_SCHEMA_PUSH=true' };
  }

  return {
    allowed: false,
    reason: `schema push is disabled for the non-local database at ${databaseHost(databaseUrl) ?? 'an unparsable URL'}; set RER_ALLOW_LIVE_SCHEMA_PUSH=true only for a reviewed rollout step`,
  };
}

/**
 * A write script against a non-local database must be told which host it is
 * about to write to: `RER_CONFIRM_DATABASE_HOST` has to equal the host in
 * DATABASE_URL. A copied command line or a stale shell variable then cannot
 * write to the wrong database. Returns an error message, or null when allowed.
 */
export function writeTargetError({
  databaseUrl,
  confirmedHost,
}: {
  databaseUrl: string | undefined;
  confirmedHost: string | undefined;
}): string | null {
  if (isLocalDatabaseUrl(databaseUrl)) {
    return null;
  }

  const host = databaseHost(databaseUrl);
  if (!host) {
    return 'DATABASE_URL is missing or unparsable.';
  }

  if (confirmedHost !== host) {
    return `Refusing to write to the non-local database at ${host}. Re-run with RER_CONFIRM_DATABASE_HOST=${host} once you have taken and verified a backup (docs/LISTINGS-ROLLOUT.md).`;
  }

  return null;
}
