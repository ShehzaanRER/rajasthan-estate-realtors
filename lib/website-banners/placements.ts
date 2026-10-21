/**
 * The fixed set of places on the public site that a Website Banner can fill.
 *
 * Shared by the `website-banners` collection (its select options, conditions,
 * validation and revalidation paths) and the frontend data layer, so the
 * value an administrator picks and the value a page asks for cannot drift
 * apart. Adding a placement is a code change on purpose: a page has to render
 * it before a record for it means anything.
 *
 * The values are the keys of the pre-CMS registry (`home`, `properties`,
 * `rentals`, `commercial`, `projects`, `about`, `contact`) plus `our-story`,
 * and are stored in the database — never rename one.
 */

/**
 * - `hero`  — the homepage hero: full text set, one primary CTA, overlay.
 * - `page`  — a `PageBanner` header: full text set, optional CTA, overlay,
 *             alignment.
 * - `image` — a standalone photograph inside a section that owns its own copy.
 */
export type BannerKind = 'hero' | 'page' | 'image';

export const BANNER_PLACEMENTS = [
  { value: 'home', label: 'Homepage — hero', path: '/', kind: 'hero' },
  { value: 'our-story', label: 'Homepage — Our Story image', path: '/', kind: 'image' },
  { value: 'properties', label: 'Properties page', path: '/properties', kind: 'page' },
  {
    value: 'rentals',
    label: 'Properties page — Rent / Lease filter',
    path: '/properties',
    kind: 'page',
  },
  {
    value: 'commercial',
    label: 'Properties page — Commercial filter',
    path: '/properties',
    kind: 'page',
  },
  { value: 'projects', label: 'Projects page', path: '/projects', kind: 'page' },
  { value: 'about', label: 'About Us page', path: '/about', kind: 'page' },
  { value: 'contact', label: 'Contact Us page', path: '/contact', kind: 'page' },
] as const satisfies readonly {
  value: string;
  label: string;
  path: string;
  kind: BannerKind;
}[];

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]['value'];

export const BANNER_PLACEMENT_VALUES: BannerPlacement[] = BANNER_PLACEMENTS.map(
  (placement) => placement.value,
);

export function isBannerPlacement(value: unknown): value is BannerPlacement {
  return typeof value === 'string' && (BANNER_PLACEMENT_VALUES as string[]).includes(value);
}

export function placementDefinition(placement: BannerPlacement) {
  return BANNER_PLACEMENTS.find((entry) => entry.value === placement)!;
}

export function placementKind(placement: unknown): BannerKind | null {
  return isBannerPlacement(placement) ? placementDefinition(placement).kind : null;
}

/** The public path a placement renders on — what a publish revalidates. */
export function placementPath(placement: unknown): string | null {
  return isBannerPlacement(placement) ? placementDefinition(placement).path : null;
}

/**
 * The two placements that are filter variants of /properties. Each one falls
 * back to the general `properties` record while it has no published record (or
 * no photograph) of its own.
 */
export const PROPERTIES_VARIANTS = ['rentals', 'commercial'] as const satisfies readonly BannerPlacement[];

/**
 * Which banner /properties shows for the current filters.
 *
 * Rentals and commercial are filter states of /properties, not routes of their
 * own, so they get their own banner here rather than their own pages.
 * Commercial wins over rent: a commercial unit to let is still an office or a
 * shop, and the picture should say so.
 */
export function propertiesBannerPlacement(filters: {
  purpose?: string | null;
  category?: string | null;
}): 'properties' | 'rentals' | 'commercial' {
  if (filters.category === 'commercial') {
    return 'commercial';
  }

  if (filters.purpose === 'rent' || filters.purpose === 'lease') {
    return 'rentals';
  }

  return 'properties';
}

// --- constrained layout options ---------------------------------------------

export const BANNER_POSITIONS = [
  { value: 'center', label: 'Centre' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'left top', label: 'Top left' },
  { value: 'right top', label: 'Top right' },
  { value: 'left bottom', label: 'Bottom left' },
  { value: 'right bottom', label: 'Bottom right' },
] as const;

export type BannerPosition = (typeof BANNER_POSITIONS)[number]['value'];

export function isBannerPosition(value: unknown): value is BannerPosition {
  return BANNER_POSITIONS.some((option) => option.value === value);
}

export const BANNER_OVERLAYS = [
  { value: 'light', label: 'Light — more photograph, less contrast' },
  { value: 'standard', label: 'Standard (recommended)' },
  { value: 'strong', label: 'Strong — busy or bright photographs' },
] as const;

export type BannerOverlay = (typeof BANNER_OVERLAYS)[number]['value'];

export function isBannerOverlay(value: unknown): value is BannerOverlay {
  return BANNER_OVERLAYS.some((option) => option.value === value);
}

export const BANNER_ALIGNMENTS = [
  { value: 'left', label: 'Left (recommended)' },
  { value: 'center', label: 'Centred' },
] as const;

export type BannerAlign = (typeof BANNER_ALIGNMENTS)[number]['value'];

export function isBannerAlign(value: unknown): value is BannerAlign {
  return BANNER_ALIGNMENTS.some((option) => option.value === value);
}
