import type { UIFieldServerProps } from 'payload';
import { documentUrl } from '../../lib/admin-console/adminUrls';

/** Separates this sidebar block from the next field, as Payload's own fields are. */
const blockStyle = { marginBottom: 24 } as const;

const labelStyle = {
  color: 'var(--theme-elevation-500)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  marginBottom: 4,
  textTransform: 'uppercase',
} as const;

/**
 * Sidebar block on the listing edit page: the parent property's own permanent
 * Property ID, title and location, linking to the property. Together with the
 * Listing ID field above it, this is what keeps the two identifiers visibly
 * distinct — RER-00001 names the unit, RER-L-00031 names this transaction.
 */
export async function ListingPropertySummary({ data, payload }: UIFieldServerProps) {
  const raw = data?.property;
  const propertyId = raw && typeof raw === 'object' ? (raw as { id?: number | string }).id : raw;

  if (propertyId === undefined || propertyId === null || propertyId === '') {
    return (
      <div style={blockStyle}>
        <p style={labelStyle}>Property</p>
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: 13, margin: 0 }}>
          Choose a property in the Listing tab.
        </p>
      </div>
    );
  }

  const property = await payload.findByID({
    collection: 'properties',
    id: propertyId,
    depth: 0,
    select: { propertyId: true, title: true, location: true },
    overrideAccess: true,
    disableErrors: true,
  });

  if (!property) {
    return (
      <div style={blockStyle}>
        <p style={labelStyle}>Property</p>
        <p style={{ color: 'var(--theme-error-600)', fontSize: 13, margin: 0 }}>
          The linked property could not be found.
        </p>
      </div>
    );
  }

  const location = [property.location?.locality, property.location?.city].filter(Boolean).join(', ');

  return (
    <div style={blockStyle}>
      <p style={labelStyle}>Property ID</p>
      <a
        href={documentUrl(payload.config.routes.admin, 'properties', property.id)}
        style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
      >
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{property.propertyId ?? '—'}</span>
        <span style={{ color: 'var(--theme-elevation-600)', display: 'block', fontSize: 12 }}>
          {property.title}
          {location ? ` · ${location}` : ''}
        </span>
      </a>
    </div>
  );
}

export default ListingPropertySummary;
