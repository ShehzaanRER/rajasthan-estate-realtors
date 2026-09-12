import type { DefaultServerCellComponentProps } from 'payload';
import type { Property } from '../../payload-types';
import { mapPricing } from '../../lib/properties/formatPrice';

const VALID_PURPOSES: readonly Property['purpose'][] = ['sale', 'rent', 'lease'];

function isValidPurpose(value: unknown): value is Property['purpose'] {
  return typeof value === 'string' && (VALID_PURPOSES as readonly string[]).includes(value);
}

/**
 * List-view Cell for the Properties `pricing` group. Reuses `mapPricing` —
 * the same function that produces the public site's price display — so the
 * sale/rent/lease branching, "Price on request" fallback, and rent-period
 * suffix logic exist in exactly one place. This Cell only formats what
 * `mapPricing` already returns; it never recomputes a price itself.
 */
export function PriceCell({ rowData }: DefaultServerCellComponentProps) {
  const purpose: unknown = rowData?.purpose;

  if (!isValidPurpose(purpose)) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const pricing = rowData?.pricing as Property['pricing'] | undefined;
  const { displayPrice, negotiable } = mapPricing(purpose, pricing);

  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {displayPrice}
      {negotiable ? <span style={{ color: 'var(--theme-elevation-500)', marginLeft: 4 }}>· Negotiable</span> : null}
    </span>
  );
}

export default PriceCell;
