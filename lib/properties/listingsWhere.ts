import type { Where } from 'payload';
import type { Listing, Property } from '../../payload-types';
import { publicStatusWhere } from './publicScope';

/**
 * The filter dialect of the public search, as pure functions with no Payload
 * import so it can be unit-tested. `getProperties.ts` runs the result.
 */

export type GetPropertiesOptions = {
  /** Transaction type — the search's Buy / Rent / Lease. */
  purpose?: Listing['transactionType'];
  category?: NonNullable<Property['propertyCategory']>;
  /** Exact CMS locality value, e.g. "Andheri West". */
  locality?: string;
  bhk?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
};

/**
 * Sale, rent and lease each store their amount in a different field, so a
 * budget can only be applied once the purpose is known. Filtering the wrong
 * field would silently exclude everything.
 */
export function priceFieldFor(purpose: Listing['transactionType'] | undefined): string | null {
  if (purpose === 'sale') {
    return 'pricing.price';
  }

  if (purpose === 'rent') {
    return 'pricing.rentAmount';
  }

  if (purpose === 'lease') {
    return 'pricing.monthlyLeasePayment';
  }

  return null;
}

/**
 * Builds the `where` for the LISTINGS collection. Transaction facts (type,
 * status, price) are columns of the listing; the physical facts a visitor
 * filters by (category, locality, BHK) are reached through its `property`
 * relationship, so there is one copy of each and a sale and a rent listing of
 * the same flat can never disagree about where it is.
 */
export function publicListingsWhere(options: GetPropertiesOptions): Where {
  const { purpose, category, locality, bhk, minPrice, maxPrice } = options;
  const clauses: Where[] = [publicStatusWhere()];

  if (purpose) {
    clauses.push({ transactionType: { equals: purpose } });
  }

  if (category) {
    clauses.push({ 'property.propertyCategory': { equals: category } });
  }

  if (locality) {
    clauses.push({ 'property.location.locality': { equals: locality } });
  }

  if (typeof bhk === 'number') {
    clauses.push({ 'property.details.bedrooms': { equals: bhk } });
  }

  const priceField = priceFieldFor(purpose);
  if (priceField) {
    if (typeof minPrice === 'number') {
      clauses.push({ [priceField]: { greater_than_equal: minPrice } });
    }

    if (typeof maxPrice === 'number') {
      clauses.push({ [priceField]: { less_than: maxPrice } });
    }
  }

  return clauses.length === 1 ? clauses[0] : { and: clauses };
}
