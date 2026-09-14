/**
 * The single slugification primitive for the whole application.
 *
 * It was previously defined inside `lib/brochure-convert/slug.ts`, which made
 * it look brochure-specific. Property slug generation needs exactly the same
 * transform, and two independently maintained copies of a function that
 * produces public URLs is the kind of drift that is only noticed once a URL is
 * already wrong. `brochure-convert/slug.ts` now re-exports this, so its
 * existing callers are unchanged.
 *
 * Not shared with `slugifyLocality()` in `lib/properties/filterParams.ts`:
 * that one owns the *filter query* dialect rather than a stored URL, and
 * collapsing the two would couple the listing's parameter format to the
 * persisted slug format. They agree on output for realistic locality names;
 * they are deliberately allowed to diverge.
 */

/** Longest slug segment we will ever persist. Keeps URLs and log lines sane. */
const MAX_SLUG_LENGTH = 96;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH);
}

/**
 * Joins pre-slugified parts, dropping empties. Used where a slug is assembled
 * from optional fields and a missing one must collapse cleanly rather than
 * leave a doubled or trailing hyphen.
 */
export function joinSlugParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part) => part.length > 0)
    .join('-');
}
