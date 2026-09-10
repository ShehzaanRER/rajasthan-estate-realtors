import type { Where } from 'payload';
import type { Project } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProject } from './mapProject';
import { publicProjectStatusWhere } from './publicScope';
import type { PublicProject } from './types';

const RELATED_LIMIT = 3;

/**
 * Simple, server-side "related projects" lookup — no recommendation
 * engine. Tries locality + project type first, then broadens to city +
 * project type if that doesn't find enough, excluding the current project
 * either way. Returns fewer than RELATED_LIMIT (even zero) rather than
 * padding with unrelated projects.
 */
export async function getRelatedProjects(current: PublicProject): Promise<PublicProject[]> {
  const payload = await getPayloadClient();
  const excludeSelf: Where = { slug: { not_equals: current.slug } };

  const strict = await payload.find({
    collection: 'projects',
    where: {
      and: [
        publicProjectStatusWhere(),
        excludeSelf,
        { 'location.locality': { equals: current.location.locality } },
        ...(current.projectType ? [{ 'projectDetails.projectType': { equals: current.projectType } }] : []),
      ],
    },
    depth: 2,
    limit: RELATED_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  const docs = [...strict.docs];

  if (docs.length < RELATED_LIMIT) {
    const broader = await payload.find({
      collection: 'projects',
      where: {
        and: [
          publicProjectStatusWhere(),
          excludeSelf,
          { 'location.city': { equals: current.location.city } },
          ...(current.projectType ? [{ 'projectDetails.projectType': { equals: current.projectType } }] : []),
        ],
      },
      depth: 2,
      limit: RELATED_LIMIT,
      overrideAccess: false,
      sort: '-updatedAt',
    });

    const seen = new Set(docs.map((doc) => doc.id));
    for (const doc of broader.docs) {
      if (docs.length >= RELATED_LIMIT) break;
      if (!seen.has(doc.id)) {
        docs.push(doc);
        seen.add(doc.id);
      }
    }
  }

  return docs
    .slice(0, RELATED_LIMIT)
    .map((doc) => mapProject(doc as Project))
    .filter((project): project is PublicProject => project !== null);
}
