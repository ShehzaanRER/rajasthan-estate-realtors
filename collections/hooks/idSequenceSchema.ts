import type { PostgresAdapterArgs } from '@payloadcms/db-postgres';
import { pgSequence } from '@payloadcms/db-postgres/drizzle/pg-core';
import { RER_LISTING_ID_SEQUENCE } from './assignListingId';
import { RER_PROJECT_ID_SEQUENCE } from './assignProjectId';
import { RER_PROPERTY_ID_SEQUENCE } from './assignPropertyId';

type PostgresSchemaHook = NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number];

/**
 * Declares the RER ID sequences (property, project, listing) to Drizzle so the dev schema push owns them.
 *
 * Why this exists: `next dev` runs Payload in push mode. Every push (the
 * initial boot AND every HMR reload that changes the schema) introspects every
 * sequence in `public`, diffs that against the Drizzle schema, and issues
 * `DROP SEQUENCE` for any it does not recognise. `rer_property_id_seq` and
 * `rer_project_id_seq` are created by `onInit` with raw SQL, so they were
 * unknown to the schema and got dropped. `onInit` does not re-run on an HMR
 * reload, so they stayed missing until the server was restarted, and every
 * create failed with `Failed query: SELECT nextval('rer_project_id_seq')`.
 *
 * Declaring them makes the push keep them (and create them if absent). The
 * options mirror `CREATE SEQUENCE ... AS BIGINT INCREMENT BY 1 MINVALUE 1
 * START WITH 1` in `ensure*IdSequence` exactly, so the push sees no drift and
 * never issues an ALTER that could reset the counter.
 *
 * Payload only reads `tables`, `relations` and `enums` back from a schema
 * hook, and spreads `enums` straight into the object handed to drizzle-kit, so
 * `enums` is the carrier that gets a non-table object into the push.
 */
const idSequenceOptions = {
  startWith: 1,
  increment: 1,
  minValue: 1,
  maxValue: '9223372036854775807',
  cache: 1,
  cycle: false,
} as const;

export const idSequenceSchemaHook: PostgresSchemaHook = ({ schema }) => ({
  ...schema,
  enums: {
    ...schema.enums,
    [RER_PROPERTY_ID_SEQUENCE]: pgSequence(RER_PROPERTY_ID_SEQUENCE, idSequenceOptions),
    [RER_PROJECT_ID_SEQUENCE]: pgSequence(RER_PROJECT_ID_SEQUENCE, idSequenceOptions),
    [RER_LISTING_ID_SEQUENCE]: pgSequence(RER_LISTING_ID_SEQUENCE, idSequenceOptions),
  } as unknown as typeof schema.enums,
});
