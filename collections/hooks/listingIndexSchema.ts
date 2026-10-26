import type { PostgresAdapterArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';
import { uniqueIndex } from '@payloadcms/db-postgres/drizzle/pg-core';
import { ACTIVE_LISTING_STATUSES } from '../../lib/listings/vocabulary';

type PostgresSchemaHook = NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number];

/**
 * Database-level backstop for "one active listing per transaction type per
 * property".
 *
 * `validateListing` checks the rule before every save, but a check followed by a
 * write cannot stop two saves that run at the same instant: both read "no active
 * Sale listing yet" and both insert. This partial unique index makes the second
 * insert fail inside PostgreSQL, whatever the timing.
 *
 * Partial, so it only constrains ACTIVE listings (draft, available, under-offer —
 * `ACTIVE_LISTING_STATUSES`). Sold, rented and withdrawn listings are history: a
 * flat can have any number of past rentals, and closing a listing is exactly what
 * frees its slot for a new one.
 *
 * Declared through `afterSchemaInit` (like the ID sequences in
 * `idSequenceSchema.ts`) because Payload's own `indexes` option cannot express a
 * partial index. Being part of the Drizzle schema means the dev push creates it
 * and keeps it instead of dropping it as unknown. The WHERE clause is written in
 * the exact form PostgreSQL stores it back as (`pg_get_expr`), so the push sees no
 * drift on later boots.
 */
export const ACTIVE_LISTING_INDEX = 'listings_one_active_per_type_idx';

const activeStatusesSql = ACTIVE_LISTING_STATUSES.map(
  (status) => `'${status}'::enum_listings_status`,
).join(', ');

export const ACTIVE_LISTING_INDEX_WHERE = `(status = ANY (ARRAY[${activeStatusesSql}]))`;

export const listingIndexSchemaHook: PostgresSchemaHook = ({ adapter, extendTable, schema }) => {
  const listings = schema.tables.listings;
  if (!listings) {
    return schema;
  }

  extendTable({
    table: listings,
    extraConfig: (table) => ({
      [ACTIVE_LISTING_INDEX]: uniqueIndex(ACTIVE_LISTING_INDEX)
        .on(table.property, table.transactionType)
        .where(sql.raw(ACTIVE_LISTING_INDEX_WHERE)),
    }),
  });

  // A violation is reported by Payload against the field this maps to, so the
  // admin shows it on Transaction type rather than on an unknown path.
  adapter.fieldConstraints.listings = {
    ...(adapter.fieldConstraints.listings ?? {}),
    [ACTIVE_LISTING_INDEX]: 'transactionType',
  };

  return schema;
};
