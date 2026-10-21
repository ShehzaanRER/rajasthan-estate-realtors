import { BANNER_DEFAULTS } from './defaults';
import { BANNER_PLACEMENTS, type BannerPlacement } from './placements';

/**
 * The draft record `scripts/seed-website-banners.ts` creates for a placement:
 * the live built-in copy, enabled, and no images.
 *
 * It is saved as a draft, so it is invisible until an administrator publishes
 * it — and the hero and Our Story placements cannot be published until a
 * desktop image is chosen. No Media relationship is ever written here, so the
 * seed cannot reference a file that does not exist.
 */
export function seedRecordFor(placement: BannerPlacement) {
  const definition = BANNER_PLACEMENTS.find((entry) => entry.value === placement)!;
  const defaults = BANNER_DEFAULTS[placement];

  return {
    name: definition.label,
    placement,
    enabled: true,
    desktopPosition: 'center' as const,
    eyebrow: defaults.eyebrow,
    heading: defaults.heading,
    headingAccent: defaults.accent,
    description: defaults.description,
    showCta: Boolean(defaults.cta),
    ctaLabel: defaults.cta?.label ?? null,
    ctaUrl: defaults.cta?.href ?? null,
    overlay: defaults.overlay,
    textAlign: defaults.align,
    _status: 'draft' as const,
  };
}

/**
 * Placements that need a seed record: every placement with no record of any
 * kind — draft, published or disabled. A placement that already has one is
 * left alone entirely, so re-running the seed never duplicates a record and
 * never overwrites an administrator's edits.
 */
export function placementsToSeed(existingPlacements: readonly unknown[]): BannerPlacement[] {
  const existing = new Set(existingPlacements);
  return BANNER_PLACEMENTS.map(({ value }) => value).filter((value) => !existing.has(value));
}
