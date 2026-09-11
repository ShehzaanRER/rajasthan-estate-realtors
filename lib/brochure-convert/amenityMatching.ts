import type { Payload } from 'payload';
import type { Amenity } from '../../payload-types';

/**
 * Matches extracted amenity phrases against the existing Amenities
 * collection by normalized exact match only — no fuzzy/ML matching, and
 * never silently creates new Amenity records. Anything unmatched is
 * surfaced to the admin as a review flag instead.
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
