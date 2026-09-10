import type { Where } from 'payload';
import type { Property } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProperty } from './mapProperty';
import { publicStatusWhere } from './publicScope';
import type { PublicProperty } from './types';

const PUBLIC_PROPERTY_DEPTH = 2;
const PUBLIC_PROPERTY_LIMIT = 100;

export type GetPropertiesOptions = {
  purpose?: Property['purpose'];
  category?: NonNullable<Property['propertyCategory']>;
};

function publicPropertiesWhere(options: GetPropertiesOptions): Where {
  const { purpose, category } = options;

  if (!purpose && !category) {
    return publicStatusWhere();
  }

  return {
    and: [
      publicStatusWhere(),
      ...(purpose ? [{ purpose: { equals: purpose } }] : []),
      ...(category ? [{ propertyCategory: { equals: category } }] : []),
    ],
  };
}

export async function getProperties(
  options: GetPropertiesOptions = {},
): Promise<PublicProperty[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'properties',
    where: publicPropertiesWhere(options),
    depth: PUBLIC_PROPERTY_DEPTH,
    limit: PUBLIC_PROPERTY_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  return result.docs
    .map((doc) => mapProperty(doc as Property))
    .filter((property): property is PublicProperty => property !== null);
}
