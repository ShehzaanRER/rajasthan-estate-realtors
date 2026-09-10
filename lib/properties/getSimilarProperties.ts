import type { Where } from 'payload';
import type { Property } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProperty } from './mapProperty';
import { publicStatusWhere } from './publicScope';
import type { PublicProperty } from './types';

const SIMILAR_LIMIT = 3;

/**
 * Simple, server-side "similar properties" lookup — no recommendation
 * engine. Tries locality + purpose first (most relevant), then broadens to
 * city + purpose if that doesn't find enough, excluding the current
 * property either way. Returns fewer than SIMILAR_LIMIT (even zero) rather
 * than padding with unrelated listings.
 */
export async function getSimilarProperties(current: PublicProperty): Promise<PublicProperty[]> {
  const payload = await getPayloadClient();
  const excludeSelf: Where = { slug: { not_equals: current.slug } };

  const strict = await payload.find({
    collection: 'properties',
    where: {
      and: [
        publicStatusWhere(),
        excludeSelf,
        { 'location.locality': { equals: current.location.locality } },
        { purpose: { equals: current.purpose } },
      ],
    },
    depth: 2,
    limit: SIMILAR_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  const docs = [...strict.docs];

  if (docs.length < SIMILAR_LIMIT) {
    const broader = await payload.find({
      collection: 'properties',
      where: {
        and: [
          publicStatusWhere(),
          excludeSelf,
          { 'location.city': { equals: current.location.city } },
          { purpose: { equals: current.purpose } },
        ],
      },
      depth: 2,
      limit: SIMILAR_LIMIT,
      overrideAccess: false,
      sort: '-updatedAt',
    });

    const seen = new Set(docs.map((doc) => doc.id));
    for (const doc of broader.docs) {
      if (docs.length >= SIMILAR_LIMIT) break;
      if (!seen.has(doc.id)) {
        docs.push(doc);
        seen.add(doc.id);
      }
    }
  }

  return docs
    .slice(0, SIMILAR_LIMIT)
    .map((doc) => mapProperty(doc as Property))
    .filter((property): property is PublicProperty => property !== null);
}
