import type { Property } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProperty } from './mapProperty';
import { publicFeaturedWhere } from './publicScope';
import type { PublicProperty } from './types';

const DEFAULT_FEATURED_LIMIT = 100;

export type GetFeaturedPropertiesOptions = {
  limit?: number;
};

export async function getFeaturedProperties(
  options: GetFeaturedPropertiesOptions = {},
): Promise<PublicProperty[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'properties',
    where: publicFeaturedWhere(),
    depth: 2,
    limit: options.limit ?? DEFAULT_FEATURED_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  return result.docs
    .map((doc) => mapProperty(doc as Property))
    .filter((property): property is PublicProperty => property !== null);
}
