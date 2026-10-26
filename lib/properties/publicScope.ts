import type { Where } from 'payload';
import type { Listing, Property } from '../../payload-types';

/**
 * Public visibility is decided per LISTING. A property is visible only through a
 * public listing; the property's own roll-up `status` (lib/listings/rollup.ts)
 * mirrors this so the collection's public read access works, but no public query
 * relies on it for what to show.
 */
export const PUBLIC_STATUSES = ['available', 'under-offer'] as const;

export type PublicPropertyStatus = (typeof PUBLIC_STATUSES)[number];

export function isPublicStatus(
  status: Property['status'] | Listing['status'] | string | null | undefined,
): status is PublicPropertyStatus {
  return status === 'available' || status === 'under-offer';
}

export function publicStatusWhere(): Where {
  return {
    status: {
      in: [...PUBLIC_STATUSES],
    },
  };
}

/** Featured is a LISTING tag: featuring the rental does not feature the sale. */
export function publicFeaturedWhere(): Where {
  return {
    and: [
      publicStatusWhere(),
      {
        tags: {
          contains: 'featured',
        },
      },
    ],
  };
}

export function publicSlugWhere(slug: string): Where {
  return {
    and: [
      publicStatusWhere(),
      {
        slug: {
          equals: slug,
        },
      },
    ],
  };
}
