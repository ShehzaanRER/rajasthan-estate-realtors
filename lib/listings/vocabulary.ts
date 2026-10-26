/**
 * The Listings vocabulary: transaction types, listing statuses and the rules
 * that relate them.
 *
 * A Listing is one transaction (sale, rent or lease) offered on a physical
 * Property. Kept in a dependency-free module so the collection config, the
 * hooks, the public data layer, the migration and the tests all read the same
 * definitions instead of each holding a copy.
 */

export const TRANSACTION_TYPES = ['sale', 'rent', 'lease'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const LISTING_STATUSES = [
  'draft',
  'available',
  'under-offer',
  'sold',
  'rented',
  'withdrawn',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Statuses a visitor can see. Identical to the property vocabulary's public set. */
export const PUBLIC_LISTING_STATUSES = ['available', 'under-offer'] as const;

/**
 * A listing in one of these is finished: the deal happened, or RER stopped
 * marketing it. Closed listings are kept for history and never count toward the
 * "one active listing per transaction type" rule.
 */
export const CLOSED_LISTING_STATUSES = ['sold', 'rented', 'withdrawn'] as const;

/** Everything that is not closed — draft, available and under-offer. */
export const ACTIVE_LISTING_STATUSES = ['draft', 'available', 'under-offer'] as const;

export function isTransactionType(value: unknown): value is TransactionType {
  return typeof value === 'string' && (TRANSACTION_TYPES as readonly string[]).includes(value);
}

export function isListingStatus(value: unknown): value is ListingStatus {
  return typeof value === 'string' && (LISTING_STATUSES as readonly string[]).includes(value);
}

export function isPublicListingStatus(value: unknown): boolean {
  return typeof value === 'string' && (PUBLIC_LISTING_STATUSES as readonly string[]).includes(value);
}

export function isActiveListingStatus(value: unknown): boolean {
  return typeof value === 'string' && (ACTIVE_LISTING_STATUSES as readonly string[]).includes(value);
}

/** Rent and lease are both tenancies: they close as `rented`, never `sold`. */
export function isTenancyType(type: TransactionType): boolean {
  return type === 'rent' || type === 'lease';
}

/**
 * The "deal done" status for a transaction type. A sale closes as `sold`; a
 * rent or lease closes as `rented`. The opposite pairing is meaningless and is
 * rejected by the listing rules.
 */
export function closedStatusFor(type: TransactionType): 'sold' | 'rented' {
  return isTenancyType(type) ? 'rented' : 'sold';
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Sale',
  rent: 'Rent',
  lease: 'Lease',
};

/**
 * Tags that describe one listing's marketing rather than the physical unit.
 * `featured` on the rental must not feature the sale, so these live on the
 * Listing. The remaining tags on a Property (new-development, ready-to-move, ...)
 * describe the unit and stay there.
 */
export const LISTING_LEVEL_TAGS = ['featured', 'new', 'premium', 'price-reduced'] as const;
export type ListingLevelTag = (typeof LISTING_LEVEL_TAGS)[number];

export function isListingLevelTag(value: unknown): value is ListingLevelTag {
  return typeof value === 'string' && (LISTING_LEVEL_TAGS as readonly string[]).includes(value);
}

/** Display order when a property has several public listings and one must lead. */
export const TRANSACTION_PRIORITY: Record<TransactionType, number> = {
  sale: 0,
  rent: 1,
  lease: 2,
};
