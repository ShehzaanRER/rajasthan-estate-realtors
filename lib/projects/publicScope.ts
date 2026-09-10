import type { Where } from 'payload';
import type { Project } from '../../payload-types';

export const PUBLIC_PROJECT_STATUSES = [
  'upcoming',
  'under-construction',
  'ready-to-move',
  'completed',
  'sold-out',
] as const;

export type PublicProjectStatus = (typeof PUBLIC_PROJECT_STATUSES)[number];

export function isPublicProjectStatus(
  status: Project['status'] | string | null | undefined,
): status is PublicProjectStatus {
  return (PUBLIC_PROJECT_STATUSES as readonly string[]).includes(status as string);
}

export function publicProjectStatusWhere(): Where {
  return {
    status: {
      in: [...PUBLIC_PROJECT_STATUSES],
    },
  };
}

export function publicProjectSlugWhere(slug: string): Where {
  return {
    and: [
      publicProjectStatusWhere(),
      {
        slug: {
          equals: slug,
        },
      },
    ],
  };
}
