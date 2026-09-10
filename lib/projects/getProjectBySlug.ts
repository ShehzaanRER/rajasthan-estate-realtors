import { cache } from 'react';
import type { Project } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProject } from './mapProject';
import { publicProjectSlugWhere } from './publicScope';
import type { PublicProject } from './types';

export const getProjectBySlug = cache(async (slug: string): Promise<PublicProject | null> => {
  const normalized = slug?.trim();
  if (!normalized) {
    return null;
  }

  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'projects',
    where: publicProjectSlugWhere(normalized),
    depth: 2,
    limit: 1,
    overrideAccess: false,
  });

  const doc = result.docs[0];
  if (!doc) {
    return null;
  }

  return mapProject(doc as Project);
});
