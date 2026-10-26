import type { Payload, PayloadRequest } from 'payload';

/** A relationship value is either a bare id or a populated document. */
export function relationId(value: unknown): number | string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object') {
    const id = (value as { id?: unknown }).id;
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }

  return typeof value === 'number' || typeof value === 'string' ? value : null;
}

/**
 * Every listing of one property, any status. Used by the slug, validation and
 * roll-up hooks, so they all see the same set. `pagination: false` because a
 * property has a handful of listings and a silently truncated page here would
 * make the duplicate check pass when it should fail.
 */
export async function findListingsOfProperty({
  payload,
  propertyId,
  req,
}: {
  payload: Payload;
  propertyId: number | string;
  req?: PayloadRequest;
}) {
  const result = await payload.find({
    collection: 'listings',
    where: { property: { equals: propertyId } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });

  return result.docs;
}
