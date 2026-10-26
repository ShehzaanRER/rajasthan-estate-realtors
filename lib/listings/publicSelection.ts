import { TRANSACTION_PRIORITY, isTransactionType, type TransactionType } from './vocabulary';

/**
 * Choosing what a visitor sees when a property has several public listings.
 *
 * Search results are listings (a Sale and a Rent listing of one flat are two
 * different offers), but a result page must never show the same physical
 * property twice just because it has two. These helpers are pure so the
 * behaviour is testable without a database.
 */

function rankOf(type: unknown): number {
  return isTransactionType(type) ? TRANSACTION_PRIORITY[type] : 99;
}

/**
 * Keeps one listing per property.
 *
 * When a search is already narrowed to one transaction type there is at most
 * one candidate per property (the one-active-listing rule), so this is a no-op
 * safety net. When the search spans types, the property is shown once, as its
 * highest-priority transaction (Sale, then Rent, then Lease), and the others
 * are surfaced as "also available" links instead of extra cards.
 *
 * Order: each property keeps the position of its first appearance in `items`,
 * so the caller's sort (most recently updated first) is preserved.
 */
export function onePerProperty<T>(
  items: readonly T[],
  propertyKey: (item: T) => string | number | null | undefined,
  transactionType: (item: T) => TransactionType | string | null | undefined,
): T[] {
  const order: string[] = [];
  const best = new Map<string, T>();

  for (const item of items) {
    const key = propertyKey(item);
    if (key === null || key === undefined || key === '') {
      // A listing with no resolvable property cannot be shown at all; the
      // mapper drops it, so dropping it here keeps the two consistent.
      continue;
    }

    const id = String(key);
    const current = best.get(id);

    if (!current) {
      order.push(id);
      best.set(id, item);
      continue;
    }

    if (rankOf(transactionType(item)) < rankOf(transactionType(current))) {
      best.set(id, item);
    }
  }

  return order.map((id) => best.get(id) as T);
}

export type ListingLink = {
  listingId: string;
  slug: string;
  transactionType: TransactionType;
  displayPrice: string;
};

/** Sale, then rent, then lease. */
export function sortLinksByPriority<T extends { transactionType: TransactionType }>(links: readonly T[]): T[] {
  return [...links].sort((a, b) => rankOf(a.transactionType) - rankOf(b.transactionType));
}
