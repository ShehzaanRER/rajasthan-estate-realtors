import { findPublicListings, MAX_LISTINGS_PER_PROPERTY, toPublicProperties } from './getPublicListings';
import { publicFeaturedWhere } from './publicScope';
import type { PublicProperty } from './types';

const DEFAULT_FEATURED_LIMIT = 100;

export type GetFeaturedPropertiesOptions = {
  limit?: number;
};

/**
 * Featured is a listing-level tag, so a property whose rental is featured and
 * whose sale is not appears here as the rental. A property with both featured
 * appears once.
 */
export async function getFeaturedProperties(
  options: GetFeaturedPropertiesOptions = {},
): Promise<PublicProperty[]> {
  const limit = options.limit ?? DEFAULT_FEATURED_LIMIT;
  const listings = await findPublicListings({
    where: publicFeaturedWhere(),
    limit: limit * MAX_LISTINGS_PER_PROPERTY,
  });

  return toPublicProperties(listings, limit);
}
