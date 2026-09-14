import type { PublicProject } from '../projects/types';
import type { PublicProperty } from '../properties/types';

/**
 * Search-result titles for the two detail routes.
 *
 * These are deliberately separate from what the page displays. The `<h1>` keeps
 * the editor's own wording, which reads better in context; the `<title>` is
 * composed from structured fields, which makes it predictable, non-repetitive
 * and short enough to survive truncation.
 *
 * ## What was wrong
 *
 * The routes concatenated a free-text CMS title with `locationDisplay` — itself
 * `locality, area, city` joined — and the layout then appended
 * " | Rajasthan Estate Realtors" (28 characters). A typical result ran 85
 * characters against Google's ~60-character display budget, with the location
 * stated three times. Worse, because the CMS title is free text, an editor
 * typing "3 BHK in Andheri West" produced "3 BHK in Andheri West in Andheri
 * West, Andheri, Mumbai".
 *
 * ## Rules
 *
 * - Compose from `locality` only, never `locationDisplay`.
 * - Append the city only when the locality does not already imply it.
 * - Omit missing optional segments cleanly — no stray prepositions, no
 *   doubled separators, no "undefined".
 * - Never invent a fact that is not in the record.
 */

/** Google truncates around here; used to decide whether to shorten a name. */
const TITLE_BUDGET = 60;

/** Below this, an abbreviated name is a meaningless stub rather than a name. */
const MIN_NAME_CHARS = 12;

const PURPOSE_PHRASE: Record<PublicProperty['purpose'], string> = {
  sale: 'for Sale',
  rent: 'for Rent',
  lease: 'for Lease',
};

function normalise(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Joins "<locality>, <city>" unless the locality already contains the city —
 * "Mumbai Central, Mumbai" reads badly and adds nothing.
 */
function placePhrase(locality: string | null | undefined, city: string | null | undefined): string {
  const localityText = normalise(locality);
  const cityText = normalise(city);

  if (!localityText) {
    return cityText;
  }

  if (!cityText || localityText.toLowerCase().includes(cityText.toLowerCase())) {
    return localityText;
  }

  return `${localityText}, ${cityText}`;
}

/**
 * Shortens the leading name when the composed title overruns.
 *
 * The name is never dropped, only abbreviated: for a project it is the primary
 * identifier and the thing people actually search for. When there is genuinely
 * no room for both, the caller drops a suffix segment and tries again rather
 * than letting this function return a title with no subject.
 */
function fitToBudget(name: string, suffix: string): string {
  const full = `${name} ${suffix}`.trim();
  if (full.length <= TITLE_BUDGET || !name) {
    return full;
  }

  const room = TITLE_BUDGET - suffix.length - 2;
  if (room < MIN_NAME_CHARS) {
    // Signals the caller to shed a suffix segment; see projectSeoTitle.
    return '';
  }

  return `${trimTrailingPunctuation(name.slice(0, room))}… ${suffix}`;
}

function trimTrailingPunctuation(value: string): string {
  return value.trimEnd().replace(/[,\-–—:;]+$/, '').trimEnd();
}

/**
 * e.g. "3 BHK Apartment for Sale in Andheri West, Mumbai"
 *      "Office for Rent in Lower Parel, Mumbai"
 */
export function propertySeoTitle(property: PublicProperty): string {
  const bedrooms =
    typeof property.bedrooms === 'number' && property.bedrooms > 0
      ? `${property.bedrooms} BHK`
      : null;

  const parts = [bedrooms, property.propertyTypeLabel, PURPOSE_PHRASE[property.purpose]]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  const place = placePhrase(property.location.locality, property.location.city);
  if (!place) {
    return parts;
  }

  const full = `${parts} in ${place}`;
  if (full.length <= TITLE_BUDGET) {
    return full;
  }

  // An unusually long locality name pushes the title over budget. Drop the city
  // rather than truncating anything: the locality already implies it, and every
  // remaining word is load-bearing.
  const locality = normalise(property.location.locality);
  return locality ? `${parts} in ${locality}` : full;
}

/**
 * e.g. "Amara by Lodha Group in Jogeshwari West"
 *
 * The developer is kept because it is a real query term — people search
 * "<developer> projects <locality>" — but it is dropped before the locality if
 * the name is long enough to push the title past the budget.
 */
export function projectSeoTitle(project: PublicProject): string {
  const name = normalise(project.name);
  const developer = normalise(project.developer);
  const place = placePhrase(project.location.locality, project.location.city);

  // Most to least informative. Each candidate sheds one segment, and the name
  // is present in every one of them — a title beginning "by Lodha Group in…"
  // with no project name is worse than any amount of truncation.
  const candidates = [
    [developer && `by ${developer}`, place && `in ${place}`],
    // The locality outranks the developer when only one fits.
    [place && `in ${place}`],
    [developer && `by ${developer}`],
    [],
  ];

  for (const parts of candidates) {
    const suffix = parts.filter((part): part is string => Boolean(part)).join(' ');
    const candidate = fitToBudget(name, suffix);
    if (candidate) {
      return candidate;
    }
  }

  // Every suffix dropped and the bare name still overruns: abbreviate it.
  return `${trimTrailingPunctuation(name.slice(0, TITLE_BUDGET - 1))}…`;
}
