import type { DefaultServerCellComponentProps } from 'payload';
import { sortListingSummaries, summariseListing } from '../../lib/listings/summary';
import { statusTier, TIER_STYLES } from '../../lib/statusTiers';

/**
 * List-view Cell for the Properties `listingsSummary` column: one small chip per
 * listing ("Sale · Available", "Rent · Rented"), so staff can see at a glance
 * which transactions a property has and where each stands.
 *
 * One query per visible row. The list is paginated and short, and the
 * alternative — denormalising listing data onto the property — is exactly the
 * duplication this model exists to remove.
 */
export async function PropertyListingsCell({ payload, rowData }: DefaultServerCellComponentProps) {
  const propertyId = rowData?.id;

  if (propertyId === undefined || propertyId === null) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>—</span>;
  }

  const { docs } = await payload.find({
    collection: 'listings',
    where: { property: { equals: propertyId } },
    depth: 0,
    pagination: false,
    select: { listingId: true, transactionType: true, status: true, pricing: true },
    overrideAccess: true,
  });

  if (docs.length === 0) {
    return <span style={{ color: 'var(--theme-elevation-400)' }}>No listings</span>;
  }

  const listings = sortListingSummaries(docs.map((doc) => summariseListing(doc)));

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
      {listings.map((listing) => {
        const style = TIER_STYLES[statusTier(listing.status)];
        return (
          <span
            key={listing.id}
            title={`${listing.listingId} · ${listing.displayPrice}`}
            style={{
              background: style.background,
              border: `1px solid ${style.border}`,
              borderRadius: 999,
              color: style.color,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: '18px',
              padding: '2px 10px',
              whiteSpace: 'nowrap',
            }}
          >
            {listing.typeLabel} · {listing.status.replace('-', ' ')}
          </span>
        );
      })}
    </span>
  );
}

export default PropertyListingsCell;
