import type { Where } from 'payload';
import type { Listing } from '../../payload-types';
import { onePerProperty } from '../listings/publicSelection';
import { getPayloadClient } from '../payload';
import { mapListing, mapListingLink } from './mapListing';
import { publicStatusWhere } from './publicScope';
import type { PublicListingLink, PublicProperty } from './types';

/**
 * Shared plumbing for the public queries. Every one of them reads the
 * `listings` collection — a listing is what a visitor sees — at depth 2 so the
 * parent property and its media and amenities arrive populated, through the
 * Local API with `overrideAccess: false`.
 */
export const PUBLIC_LISTING_DEPTH = 2;

/** Listings, not properties, are counted against this: up to three per unit. */
export const MAX_LISTINGS_PER_PROPERTY = 3;

export async function findPublicListings({
  where,
  limit,
  sort = '-updatedAt',
}: {
  where: Where;
  limit: number;
  sort?: string;
}): Promise<Listing[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'listings',
    where,
    depth: PUBLIC_LISTING_DEPTH,
    limit,
    overrideAccess: false,
    sort,
  });

  return result.docs as Listing[];
}

function propertyDocId(listing: Listing): number | null {
  return typeof listing.property === 'object' && listing.property ? listing.property.id : null;
}

/**
 * Public listings of the given properties, grouped by property id. Used to say
 * "also for rent" on a card or detail page. One depth-0 query for the whole
 * result set rather than one per card.
 */
export async function getPublicListingLinks(
  propertyIds: readonly number[],
): Promise<Map<number, PublicListingLink[]>> {
  const links = new Map<number, PublicListingLink[]>();
  if (propertyIds.length === 0) {
    return links;
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'listings',
    where: { and: [publicStatusWhere(), { property: { in: [...propertyIds] } }] },
    depth: 0,
    pagination: false,
    overrideAccess: false,
    select: { listingId: true, slug: true, transactionType: true, status: true, pricing: true, property: true },
  });

  for (const doc of result.docs as Listing[]) {
    const link = mapListingLink(doc);
    const propertyId = typeof doc.property === 'number' ? doc.property : null;
    if (!link || propertyId === null) {
      continue;
    }

    const existing = links.get(propertyId);
    if (existing) {
      existing.push(link);
    } else {
      links.set(propertyId, [link]);
    }
  }

  return links;
}

/**
 * Maps listing documents to what the site renders: one entry per physical
 * property (see `onePerProperty`), each carrying its sibling public listings.
 *
 * `limit` bounds properties, matching how every page already thinks about it.
 */
export async function toPublicProperties(listings: Listing[], limit?: number): Promise<PublicProperty[]> {
  const unique = onePerProperty(listings, propertyDocId, (listing) => listing.transactionType);
  const bounded = typeof limit === 'number' ? unique.slice(0, limit) : unique;

  const ids = bounded.map(propertyDocId).filter((id): id is number => id !== null);
  const links = await getPublicListingLinks(ids);

  return bounded
    .map((listing) => {
      const id = propertyDocId(listing);
      return mapListing(listing, { otherListings: id === null ? [] : (links.get(id) ?? []) });
    })
    .filter((property): property is PublicProperty => property !== null);
}
