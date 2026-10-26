import { mapPricing } from '../properties/formatPrice';
import {
  isTransactionType,
  TRANSACTION_PRIORITY,
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from './vocabulary';

/**
 * One line per listing for the admin: "Rent · RER-L-00031 · ₹75,000 / month".
 * Shared by the property sidebar, the property list Cell and the console so a
 * listing reads the same wherever staff meet it.
 */
export type ListingSummaryInput = {
  id: number | string;
  listingId?: string | null;
  transactionType?: unknown;
  status?: string | null;
  pricing?: Parameters<typeof mapPricing>[1];
};

export type ListingSummary = {
  id: number | string;
  listingId: string;
  transactionType: TransactionType | null;
  typeLabel: string;
  status: string;
  displayPrice: string;
};

export function summariseListing(input: ListingSummaryInput): ListingSummary {
  const type = isTransactionType(input.transactionType) ? input.transactionType : null;

  return {
    id: input.id,
    listingId: input.listingId ?? '—',
    transactionType: type,
    typeLabel: type ? TRANSACTION_TYPE_LABELS[type] : 'Unknown',
    status: input.status ?? '',
    displayPrice: type ? mapPricing(type, input.pricing).displayPrice : '—',
  };
}

/** Sale first, then rent, then lease — the order a property's listings read in. */
export function sortListingSummaries(summaries: ListingSummary[]): ListingSummary[] {
  return [...summaries].sort((a, b) => {
    const rankA = a.transactionType ? TRANSACTION_PRIORITY[a.transactionType] : 99;
    const rankB = b.transactionType ? TRANSACTION_PRIORITY[b.transactionType] : 99;
    return rankA - rankB;
  });
}
