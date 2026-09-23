import type { Payload } from 'payload';
import type { Amenity } from '../../payload-types';
import { slugify } from '../slugify';

/**
 * Matches extracted amenity phrases against the existing Amenities
 * collection by normalized exact match only — no fuzzy/ML matching.
 * `matchAmenities` itself never writes to the database (it's also used by
 * the read-only /validate endpoint for the preview step); anything it
 * can't match is created as a new Amenity record by `createMissingAmenities`,
 * which only runs at actual draft-creation time.
 */

export type AmenityMatchResult = {
  matchedIds: number[];
  matchedNames: string[];
  unmatched: string[];
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function matchAmenities(payload: Payload, extractedNames: string[]): Promise<AmenityMatchResult> {
  if (extractedNames.length === 0) {
    return { matchedIds: [], matchedNames: [], unmatched: [] };
  }

  const existing = await payload.find({
    collection: 'amenities',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  const byNormalizedName = new Map<string, Amenity>();
  for (const amenity of existing.docs as Amenity[]) {
    byNormalizedName.set(normalize(amenity.name), amenity);
  }

  const matchedIds: number[] = [];
  const matchedNames: string[] = [];
  const unmatched: string[] = [];
  const seenIds = new Set<number>();

  for (const raw of extractedNames) {
    const match = byNormalizedName.get(normalize(raw));

    if (match && typeof match.id === 'number') {
      if (!seenIds.has(match.id)) {
        seenIds.add(match.id);
        matchedIds.push(match.id);
        matchedNames.push(match.name);
      }
    } else {
      unmatched.push(raw);
    }
  }

  return { matchedIds, matchedNames, unmatched };
}

export type CreatedAmenity = { id: number; name: string };

async function generateUniqueAmenitySlug(payload: Payload, name: string): Promise<string> {
  const base = slugify(name) || 'amenity';
  let candidate = base;
  let suffix = 2;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const existing = await payload.find({
      collection: 'amenities',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.totalDocs === 0) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  throw new Error(`Unable to generate a unique slug for amenity "${name}".`);
}

/**
 * Creates one Amenity master-data record per unmatched extracted name, so a
 * brochure import never silently drops an amenity just because it hasn't
 * been catalogued yet. Runs only from the create step (never from /validate)
 * since it writes to the database. Dedupes by the same normalized-name key
 * `matchAmenities` uses, so repeated or near-duplicate phrases in one source
 * only create one record.
 */
export async function createMissingAmenities(payload: Payload, names: string[]): Promise<CreatedAmenity[]> {
  if (names.length === 0) {
    return [];
  }

  const created: CreatedAmenity[] = [];
  const seen = new Set<string>();

  for (const raw of names) {
    const name = raw.trim();
    const key = normalize(name);
    if (!name || seen.has(key)) {
      continue;
    }
    seen.add(key);

    const slug = await generateUniqueAmenitySlug(payload, name);
    const amenity = await payload.create({
      collection: 'amenities',
      overrideAccess: true,
      data: { name, slug },
    });

    if (typeof amenity.id === 'number') {
      created.push({ id: amenity.id, name: amenity.name });
    }
  }

  return created;
}
