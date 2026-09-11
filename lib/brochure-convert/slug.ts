import type { Payload } from 'payload';

/**
 * Draft slugs always carry a "-draft" suffix and are checked for uniqueness
 * against the live Projects collection before use — never overwrites or
 * merges into an existing slug. Staff assign the final public slug
 * themselves when they review and publish the draft.
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

const MAX_ATTEMPTS = 50;

export async function generateUniqueDraftSlug(payload: Payload, name: string): Promise<string> {
  const base = slugify(name) || 'untitled-project';
  const draftBase = `${base}-draft`;

  let candidate = draftBase;
  let suffix = 2;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const existing = await payload.find({
      collection: 'projects',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.totalDocs === 0) {
      return candidate;
    }

    candidate = `${draftBase}-${suffix}`;
    suffix += 1;
  }

  throw new Error('Unable to generate a unique draft slug after 50 attempts. Please choose a slug manually.');
}
