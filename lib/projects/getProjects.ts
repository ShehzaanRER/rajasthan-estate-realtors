import type { Project } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProject } from './mapProject';
import { publicProjectStatusWhere } from './publicScope';
import type { PublicProject } from './types';

const PUBLIC_PROJECT_DEPTH = 2;
const PUBLIC_PROJECT_LIMIT = 100;

export async function getProjects(): Promise<PublicProject[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'projects',
    where: publicProjectStatusWhere(),
    depth: PUBLIC_PROJECT_DEPTH,
    limit: PUBLIC_PROJECT_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  return result.docs
    .map((doc) => mapProject(doc as Project))
    .filter((project): project is PublicProject => project !== null);
}
