import { sql } from '@payloadcms/db-postgres';
import type { CollectionBeforeChangeHook } from 'payload';
import { relationId } from './listingRelations';

/**
 * Serialises listing saves PER PROPERTY.
 *
 * Several listing hooks read a property's other listings and then decide:
 * `assignListingSlug` picks the first free slug, `validateListing` checks "one
 * active listing per type". Two saves for the same property at the same instant
 * would both read the same state and both decide the same thing — two listings
 * claiming the property's bare slug (one then fails on the slug index), or two
 * active listings of one type (stopped by the partial unique index, see
 * `listingIndexSchema.ts`).
 *
 * A transaction-scoped advisory lock keyed on the property makes the second save
 * wait until the first commits, then read the committed state and get the normal,
 * explained validation message. It is released automatically at commit or
 * rollback, never blocks saves of other properties, and needs no table. Runs
 * first in `beforeChange`, before anything reads sibling listings.
 *
 * Without a transaction (a caller that disabled it) there is nothing to scope
 * the lock to; the database indexes remain the guarantee.
 */
export const LISTING_LOCK_NAMESPACE = 731_400; // arbitrary, constant: "RER listings"

type TransactionSessions = Record<string, { db?: { execute: (query: unknown) => Promise<unknown> } } | undefined>;

export const lockPropertyListings: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const propertyId = Number(relationId(data?.property ?? originalDoc?.property));
  if (!Number.isInteger(propertyId) || propertyId <= 0 || !req.transactionID) {
    return data;
  }

  const transactionID = await req.transactionID;
  const sessions = (req.payload.db as unknown as { sessions?: TransactionSessions }).sessions;
  const session = sessions?.[String(transactionID)]?.db;
  if (!session) {
    return data;
  }

  await session.execute(sql`SELECT pg_advisory_xact_lock(${LISTING_LOCK_NAMESPACE}, ${propertyId})`);
  return data;
};
