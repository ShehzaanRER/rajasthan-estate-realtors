import {
  isListingStatus,
  isPublicListingStatus,
  isTenancyType,
  isTransactionType,
  type ListingStatus,
} from './vocabulary';

/**
 * What a Property's own `status` and `isTenanted` fields are derived from.
 *
 * A property no longer has a status of its own — each Listing does. The
 * property keeps a system-maintained roll-up for two reasons:
 *
 *  1. Public read access on `properties` is a `where` on `status`, so a visitor
 *     can read a property only while at least one of its listings is public.
 *  2. The admin list, console and filters already read `properties.status`.
 *
 * `isTenanted` answers a different question the single status cannot: a flat
 * can be *for sale* and *let to a tenant* at the same time. Renewal tracking
 * keys off it so a live sale listing never hides a running tenancy.
 */
export type RollupListing = {
  transactionType?: unknown;
  status?: unknown;
};

/** A property has no `withdrawn` state: see `toPropertyStatus`. */
export type PropertyStatus = Exclude<ListingStatus, 'withdrawn'>;

export type PropertyRollup = {
  status: PropertyStatus;
  isTenanted: boolean;
};

/**
 * Highest first. `available` outranks `under-offer` so the property is shown as
 * open for business whenever any listing is; `draft` is lowest because a
 * property whose only listings are drafts is simply not live yet.
 */
const STATUS_RANK: Record<ListingStatus, number> = {
  available: 5,
  'under-offer': 4,
  rented: 3,
  sold: 2,
  withdrawn: 1,
  draft: 0,
};

/**
 * `withdrawn` has no counterpart in the property vocabulary, so a property
 * whose listings are all withdrawn reports `draft` (not public, not closed by a
 * deal). Everything else maps one-to-one.
 */
function toPropertyStatus(status: ListingStatus): PropertyStatus {
  return status === 'withdrawn' ? 'draft' : status;
}

export function computePropertyRollup(listings: RollupListing[]): PropertyRollup {
  let best: ListingStatus = 'draft';
  let bestRank = -1;
  let isTenanted = false;

  for (const listing of listings) {
    if (!isListingStatus(listing.status)) {
      continue;
    }

    const rank = STATUS_RANK[listing.status];
    if (rank > bestRank) {
      best = listing.status;
      bestRank = rank;
    }

    if (
      listing.status === 'rented' &&
      isTransactionType(listing.transactionType) &&
      isTenancyType(listing.transactionType)
    ) {
      isTenanted = true;
    }
  }

  return { status: toPropertyStatus(best), isTenanted };
}

/** True when the roll-up would make the property publicly readable. */
export function rollupIsPublic(rollup: PropertyRollup): boolean {
  return isPublicListingStatus(rollup.status);
}
