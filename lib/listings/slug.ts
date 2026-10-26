import { joinSlugParts, slugify } from '../slugify';
import type { TransactionType } from './vocabulary';

/**
 * Public slug for a listing.
 *
 *   first listing of a property   -> the property's own slug (unchanged URL)
 *   any later listing             -> <property-slug>-<sale|rent|lease>[-n]
 *
 * ## Why the first listing reuses the property's slug
 *
 * Before listings existed, `/properties/<slug>` *was* the transaction. Every
 * migrated record therefore gets a listing whose slug equals its property's
 * slug, so every URL that has ever been shared, indexed or bookmarked keeps
 * resolving to the same page. Only a second, third, ... listing needs a new
 * URL, and it is derived from the property slug so it is stable and readable.
 *
 * `taken` is the set of slugs already used by listings. Passing the property's
 * existing listing slugs is what decides "first or later" — there is no
 * separate counter to drift.
 */
export function buildListingSlug({
  propertySlug,
  transactionType,
  taken,
}: {
  propertySlug: string;
  transactionType: TransactionType;
  taken: ReadonlySet<string>;
}): string | null {
  const base = propertySlug?.trim();
  if (!base) {
    return null;
  }

  if (!taken.has(base)) {
    return base;
  }

  // `slugify` lowercases, which is what the suffix wants; the base is kept
  // exactly as stored because legacy slugs are mixed-case ("Andheri") and must
  // not be rewritten.
  const withType = joinSlugParts([base, slugify(transactionType)]);
  if (!withType) {
    return null;
  }

  if (!taken.has(withType)) {
    return withType;
  }

  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${withType}-${n}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return null;
}
