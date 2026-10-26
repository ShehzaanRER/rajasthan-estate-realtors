import type { CollectionBeforeChangeHook } from 'payload';
import { buildListingSlug } from '../../lib/listings/slug';
import { isTransactionType } from '../../lib/listings/vocabulary';
import { relationId } from './listingRelations';

/**
 * Fills in a listing's public slug on create. See `lib/listings/slug.ts` for the
 * rule: the first listing of a property takes the property's own slug, so every
 * pre-existing URL keeps working; later listings get `<property-slug>-<type>`.
 *
 * Inert on update, and on a create that already carries a slug — a published
 * URL is a promise, exactly as for properties (assignPropertySlug).
 *
 * Runs after `assignListingId` and before `validateListing`. When the property
 * cannot be found it does nothing and leaves the error to `validateListing`,
 * which reports it against the right field.
 */
export const assignListingSlug: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') {
    return data;
  }

  if (typeof data.slug === 'string' && data.slug.trim()) {
    return data;
  }

  const propertyId = relationId(data.property);
  if (propertyId === null || !isTransactionType(data.transactionType)) {
    return data;
  }

  const property = await req.payload.findByID({
    collection: 'properties',
    id: propertyId,
    depth: 0,
    select: { slug: true },
    overrideAccess: true,
    disableErrors: true,
    req,
  });

  const propertySlug = typeof property?.slug === 'string' ? property.slug.trim() : '';
  if (!propertySlug) {
    return data;
  }

  // Superset query: every listing slug that contains the property slug, which
  // covers the bare slug and every `-rent` / `-sale` / `-n` variant of it.
  const existing = await req.payload.find({
    collection: 'listings',
    where: { slug: { like: propertySlug } },
    depth: 0,
    pagination: false,
    select: { slug: true },
    overrideAccess: true,
    req,
  });

  const taken = new Set(
    existing.docs
      .map((doc) => (typeof doc.slug === 'string' ? doc.slug : ''))
      .filter((slug) => slug.length > 0),
  );

  const slug = buildListingSlug({ propertySlug, transactionType: data.transactionType, taken });
  if (slug) {
    data.slug = slug;
  }

  return data;
};
