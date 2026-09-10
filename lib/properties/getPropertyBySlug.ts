import { cache } from 'react';
import type { Property } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProperty } from './mapProperty';
import { publicSlugWhere } from './publicScope';
import type { PublicProperty } from './types';

export const getPropertyBySlug = cache(async (slug: string): Promise<PublicProperty | null> => {
  const normalized = slug?.trim();
  if (!normalized) {
    return null;
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'properties',
    where: publicSlugWhere(normalized),
    depth: 2,
    limit: 1,
    overrideAccess: false,
  });

  const doc = result.docs[0];
  if (!doc) {
    return null;
  }

  return mapProperty(doc as Property);
});
