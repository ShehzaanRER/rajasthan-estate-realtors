import type { UIFieldServerProps } from 'payload';
import { documentUrl } from '../../lib/admin-console/adminUrls';
import { sortListingSummaries, summariseListing } from '../../lib/listings/summary';
import { statusTier, TIER_STYLES } from '../../lib/statusTiers';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  available: 'Available',
  'under-offer': 'Under offer',
  sold: 'Sold',
  rented: 'Rented',
  withdrawn: 'Withdrawn',
};

/** Separates this sidebar block from the next field, as Payload's own fields are. */
const blockStyle = { marginBottom: 24 } as const;

const labelStyle = {
  color: 'var(--theme-elevation-500)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  marginBottom: 6,
  textTransform: 'uppercase',
} as const;

/**
 * Sidebar block on the property edit page: every listing of this property with
 * its own Listing ID, type, status and price, each linking to that listing.
 *
 * It is what makes the Property ID / Listing ID distinction visible without
 * leaving the page — the property's ID is in the sidebar above, each row here
 * carries the ID of a transaction. Read-only: editing happens in the Listings
 * tab or on the listing itself.
 */
export async function PropertyListingsSummary({ id, payload }: UIFieldServerProps) {
  if (!id) {
    return (
      <div style={blockStyle}>
        <p style={labelStyle}>Listings</p>
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: 13, margin: 0 }}>
          Save the property first, then add its sale, rent or lease listings in the Listings tab.
        </p>
      </div>
    );
  }

  const { docs } = await payload.find({
    collection: 'listings',
    where: { property: { equals: id } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });

  const adminRoute = payload.config.routes.admin;
  const listings = sortListingSummaries(docs.map((doc) => summariseListing(doc)));

  return (
    <div style={blockStyle}>
      <p style={labelStyle}>Listings ({listings.length})</p>
      {listings.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: 13, margin: 0 }}>
          No listings yet — this property is not on the website. Add one in the Listings tab.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {listings.map((listing) => {
            const style = TIER_STYLES[statusTier(listing.status)];
            return (
              <li key={listing.id}>
                <a
                  href={documentUrl(adminRoute, 'listings', listing.id)}
                  style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
                >
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>
                    {listing.typeLabel} · {listing.listingId}
                  </span>
                  <span style={{ alignItems: 'center', display: 'flex', gap: 8, marginTop: 2 }}>
                    <span
                      style={{
                        background: style.background,
                        border: `1px solid ${style.border}`,
                        borderRadius: 999,
                        color: style.color,
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: '16px',
                        padding: '1px 8px',
                      }}
                    >
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </span>
                    <span style={{ color: 'var(--theme-elevation-600)', fontSize: 12 }}>
                      {listing.displayPrice}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PropertyListingsSummary;
