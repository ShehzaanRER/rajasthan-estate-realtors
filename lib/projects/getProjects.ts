import type { Where } from 'payload';
import type { Project } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProject } from './mapProject';
import { publicProjectStatusWhere } from './publicScope';
import type { PublicProject } from './types';

const PUBLIC_PROJECT_DEPTH = 2;
const PUBLIC_PROJECT_LIMIT = 100;

export type GetProjectsOptions = {
  projectType?: NonNullable<NonNullable<Project['projectDetails']>['projectType']>;
  status?: Project['status'];
  /** Restrict to developments the CMS flags as a current launch. */
  isNew?: boolean;
  limit?: number;
};

function publicProjectsWhere(options: GetProjectsOptions): Where {
  const clauses: Where[] = [publicProjectStatusWhere()];

  if (options.projectType) {
    clauses.push({ 'projectDetails.projectType': { equals: options.projectType } });
  }

  if (options.status) {
    clauses.push({ status: { equals: options.status } });
  }

  if (options.isNew) {
    clauses.push({ isNew: { equals: true } });
  }

  return clauses.length === 1 ? clauses[0] : { and: clauses };
}

export async function getProjects(options: GetProjectsOptions = {}): Promise<PublicProject[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'projects',
    where: publicProjectsWhere(options),
    depth: PUBLIC_PROJECT_DEPTH,
    limit: options.limit ?? PUBLIC_PROJECT_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  return result.docs
    .map((doc) => mapProject(doc as Project))
    .filter((project): project is PublicProject => project !== null);
}
