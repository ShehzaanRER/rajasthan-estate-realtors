import type { DefaultServerCellComponentProps } from 'payload';
import type { Listing } from '../../payload-types';
import { isTransactionType } from '../../lib/listings/vocabulary';
import { mapPricing } from '../../lib/properties/formatPrice';

/**
 * List-view Cell for the Listings `pricing` group. Reuses `mapPricing` —
 * the same function that produces the public site's price display — so the
 * sale/rent/lease branching, "Price on request" fallback, and rent-period
 * suffix logic exist in exactly one place. This Cell only formats what
 * `mapPricing` already returns; it never recomputes a price itself.
 */
export function PriceCell({ rowData }: DefaultServerCellComponentProps) {
  const transactionType: unknown = rowData?.transactionType;

  if (!isTransactionType(transactionType)) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const pricing = rowData?.pricing as Listing['pricing'] | undefined;
  const { displayPrice, negotiable } = mapPricing(transactionType, pricing);

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {displayPrice}
      {negotiable ? <span style={{ color: 'var(--theme-elevation-500)', marginLeft: 4 }}>· Negotiable</span> : null}
    </span>
  );
}

export default PriceCell;
