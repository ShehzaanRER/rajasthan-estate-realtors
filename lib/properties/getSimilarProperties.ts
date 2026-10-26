import type { Where } from 'payload';
import type { Listing } from '../../payload-types';
import { onePerProperty } from '../listings/publicSelection';
import { findPublicListings, MAX_LISTINGS_PER_PROPERTY, toPublicProperties } from './getPublicListings';
import { publicStatusWhere } from './publicScope';
import type { PublicProperty } from './types';

const SIMILAR_LIMIT = 3;

/**
 * Simple, server-side "similar properties" lookup — no recommendation
 * engine. Tries locality + transaction type first (most relevant), then
 * broadens to city + transaction type if that doesn't find enough.
 *
 * Excludes the current PROPERTY, not just the current listing: the unit being
 * viewed must not come back as its own "similar" suggestion through its other
 * listing. Returns fewer than SIMILAR_LIMIT (even zero) rather than padding
 * with unrelated listings, and never the same physical property twice.
 */
export async function getSimilarProperties(current: PublicProperty): Promise<PublicProperty[]> {
  const excludeSelf: Where = { 'property.propertyId': { not_equals: current.propertyId } };
  const sameType: Where = { transactionType: { equals: current.purpose } };
  const limit = SIMILAR_LIMIT * MAX_LISTINGS_PER_PROPERTY;

  const strict = await findPublicListings({
    where: {
      and: [
        publicStatusWhere(),
        excludeSelf,
        { 'property.location.locality': { equals: current.location.locality } },
        sameType,
      ],
    },
    limit,
  });

  let candidates: Listing[] = strict;

  if (onePerProperty(candidates, propertyKey, typeOf).length < SIMILAR_LIMIT) {
    const broader = await findPublicListings({
      where: {
        and: [
          publicStatusWhere(),
          excludeSelf,
          { 'property.location.city': { equals: current.location.city } },
          sameType,
        ],
      },
      limit,
    });

    candidates = [...strict, ...broader];
  }

  return toPublicProperties(candidates, SIMILAR_LIMIT);
}

function propertyKey(listing: Listing): number | null {
  return typeof listing.property === 'object' && listing.property ? listing.property.id : null;
}

function typeOf(listing: Listing): string {
  return listing.transactionType;
}
