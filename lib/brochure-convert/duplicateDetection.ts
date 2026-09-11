import type { Payload } from 'payload';
import type { Project } from '../../payload-types';

/**
 * Simple field-matching duplicate detection (name/developer/locality) — not
 * fuzzy/ML matching. Surfaces candidates for a human decision; never blocks
 * or merges automatically.
 */

export type DuplicateCandidate = {
  id: number;
  name: string;
  developer: string;
  locality: string | null;
  status: string;
  slug: string;
  matchedOn: string[];
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function findDuplicateProjects(
  payload: Payload,
  input: { name: string | null; developer: string | null; locality: string | null },
): Promise<DuplicateCandidate[]> {
  const { name, developer, locality } = input;

  if (!name && !developer) {
    return [];
  }

  const where = name ? { name: { like: name } } : { developer: { equals: developer as string } };

  const candidates = await payload.find({
    collection: 'projects',
    where,
    limit: 25,
    depth: 0,
    overrideAccess: true,
  });

  const results: DuplicateCandidate[] = [];

  for (const doc of candidates.docs as Project[]) {
    const matchedOn: string[] = [];

    if (name && normalize(doc.name) === normalize(name)) {
      matchedOn.push('name');
    }
    if (developer && normalize(doc.developer) === normalize(developer)) {
      matchedOn.push('developer');
    }
    if (locality && doc.location?.locality && normalize(doc.location.locality) === normalize(locality)) {
      matchedOn.push('locality');
    }

    if (matchedOn.length === 0 && name) {
      // "like" is a substring match — a hit on that alone (no field matching
      // exactly) still means the name is closely related enough to flag.
      matchedOn.push('similar name');
    }

    results.push({
      id: doc.id,
      name: doc.name,
      developer: doc.developer,
      locality: doc.location?.locality ?? null,
      status: doc.status,
      slug: doc.slug,
      matchedOn,
    });
  }

  return results;
}
