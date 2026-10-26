import { cache } from 'react';
import type { Listing } from '../../payload-types';
import { sortLinksByPriority } from '../listings/publicSelection';
import { getPayloadClient } from '../payload';
import { getPublicListingLinks, PUBLIC_LISTING_DEPTH } from './getPublicListings';
import { mapListing } from './mapListing';
import { publicSlugWhere, publicStatusWhere } from './publicScope';
import type { PublicProperty } from './types';

/**
 * The public detail page for `/properties/<slug>`.
 *
 * The slug names a LISTING — a Sale and a Rent listing of one flat are two
 * pages with their own price, terms and URL — but both render the same shared
 * photographs and specifications because those come from the one property.
 * Every migrated listing kept its original property's slug, so every
 * pre-existing URL resolves exactly as before.
 *
 * Returns null unless the listing is public; the route turns that into a 404.
 */
export const getPropertyBySlug = cache(async (slug: string): Promise<PublicProperty | null> => {
  const normalized = slug?.trim();
  if (!normalized) {
    return null;
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'listings',
    where: publicSlugWhere(normalized),
    depth: PUBLIC_LISTING_DEPTH,
    limit: 1,
    overrideAccess: false,
  });

  const doc = result.docs[0] as Listing | undefined;
  if (!doc) {
    return null;
  }

  const propertyId = typeof doc.property === 'object' && doc.property ? doc.property.id : null;
  const links = propertyId === null ? new Map() : await getPublicListingLinks([propertyId]);

  return mapListing(doc, { otherListings: links.get(propertyId as number) ?? [] });
});

/**
 * Resolves a slug that is not a listing slug but IS a property's own slug — the
 * master URL of the unit — to the slug of the listing to show instead.
 *
 * Normally unnecessary, because a property's first listing shares its slug. It
 * matters when staff rebuilt a property's slug with the Slug Update button:
 * the new property slug has no listing of its own, and the old one (now the
 * listing's slug) keeps working. The target is the property's highest-priority
 * public listing (Sale, then Rent, then Lease). Null when the slug names no
 * property or the property has nothing public.
 *
 * **Never for a slug that belongs to a listing.** A closed listing's URL often
 * equals its property's slug (the first listing inherits it). That URL must stay
 * a 404 while the listing is closed — the same answer a sold or rented property
 * always gave — not silently become a different transaction of the same flat, and
 * it must come back unchanged if the listing is re-published. The existence check
 * runs with `overrideAccess` because closed listings are invisible to visitors; it
 * returns nothing but a count.
 *
 * The route answers with a temporary (307) redirect: the target depends on which
 * listings are live today, so a browser must not cache it permanently.
 */
export const resolvePropertySlugToListing = cache(async (slug: string): Promise<string | null> => {
  const normalized = slug?.trim();
  if (!normalized) {
    return null;
  }

  const payload = await getPayloadClient();

  const ownedByListing = await payload.count({
    collection: 'listings',
    where: { slug: { equals: normalized } },
    overrideAccess: true,
  });
  if (ownedByListing.totalDocs > 0) {
    return null;
  }

  const result = await payload.find({
    collection: 'listings',
    where: {
      and: [publicStatusWhere(), { 'property.slug': { equals: normalized } }],
    },
    depth: 0,
    pagination: false,
    overrideAccess: false,
    select: { slug: true, transactionType: true, status: true },
  });

  const links = (result.docs as Listing[])
    .filter((doc) => typeof doc.slug === 'string' && doc.slug.length > 0)
    .map((doc) => ({ slug: doc.slug, transactionType: doc.transactionType }));

  return sortLinksByPriority(links)[0]?.slug ?? null;
});
