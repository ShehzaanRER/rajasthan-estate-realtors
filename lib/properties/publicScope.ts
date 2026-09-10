import type { Where } from 'payload';
import type { Property } from '../../payload-types';

export const PUBLIC_STATUSES = ['available', 'under-offer'] as const;

export type PublicPropertyStatus = (typeof PUBLIC_STATUSES)[number];

export function isPublicStatus(
  status: Property['status'] | string | null | undefined,
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
