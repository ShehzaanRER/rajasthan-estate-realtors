import type { Property } from '../../payload-types';
import { joinSlugParts, slugify } from '../slugify';

/**
 * Deterministic public slug for a property.
 *
 *   [<bedrooms>-bhk-]<propertyType>-<locality>-<rer-id>
 *
 *   2-bhk-apartment-andheri-west-rer-00042
 *   office-lower-parel-rer-00043
 *   shop-jogeshwari-west-rer-00044
 *
 * ## Why the RER ID is in the slug
 *
 * RER transacts several near-identical units in the same building and the same
 * locality, so a purely descriptive slug collides on ordinary inventory. The
 * usual answer — appending `-2`, `-3` — makes the one distinguishing token an
 * insertion-order accident, which is both meaningless to a reader and unstable
 * across re-imports.
 *
 * `propertyId` is already a permanent, non-editable identifier allocated
 * atomically from the `rer_property_id_seq` Postgres sequence
 * (see `collections/hooks/assignPropertyId.ts`). Using it makes the slug unique
 * *by construction*: no pre-flight "does this exist?" query, and therefore no
 * race between two concurrent creates. A five-character numeric tail costs
 * nothing in search — every property portal does the same thing.
 *
 * It also keeps the door open for locality landing pages. A future
 * `/properties/in/andheri-west` (or any locality namespace) can never be
 * shadowed by a generated property slug, because every generated slug ends in
 * `-rer-<digits>` and no locality slug ever will.
 *
 * ## Why these inputs
 *
 * Only fields that `collections/Properties.ts` marks `required: true` can be
 * relied on at create time: `purpose`, `propertyType`, `location.locality`,
 * `location.city`, plus `propertyId` from the preceding hook. `details.bedrooms`
 * is optional and simply drops out of the slug when absent — which is the
 * correct result for offices, shops, warehouses and land.
 *
 * `title` is deliberately NOT an input. It is free editor text that changes as
 * listings are re-marketed, and a slug built from it would either drift or have
 * to be frozen against a field people expect to edit.
 */

const SLUG_PROPERTY_TYPE_LABELS: Record<Property['propertyType'], string> = {
  apartment: 'apartment',
  house: 'house',
  villa: 'villa',
  office: 'office',
  shop: 'shop',
  showroom: 'showroom',
  warehouse: 'warehouse',
  land: 'land',
  other: 'property',
};

/** Matches a slug produced by `buildPropertySlug` — i.e. one ending in the RER ID. */
export const GENERATED_PROPERTY_SLUG_PATTERN = /-rer-\d{4,}$/;

export type PropertySlugInput = {
  propertyId: string;
  propertyType: Property['propertyType'];
  locality?: string | null;
  bedrooms?: number | null;
};

/**
 * Returns the slug, or `null` when `propertyId` is missing — the one input with
 * no sensible fallback, since it is what makes the result unique. Callers treat
 * `null` as "leave the slug alone and let normal validation report it".
 */
export function buildPropertySlug(input: PropertySlugInput): string | null {
  const id = slugify(input.propertyId ?? '');
  if (!id) {
    return null;
  }

  const bedrooms =
    typeof input.bedrooms === 'number' && Number.isInteger(input.bedrooms) && input.bedrooms > 0
      ? `${input.bedrooms}-bhk`
      : null;

  // `other` maps to the generic "property" rather than being dropped, so a slug
  // always carries at least one descriptive word ahead of the locality.
  const type = SLUG_PROPERTY_TYPE_LABELS[input.propertyType] ?? 'property';

  const locality = input.locality ? slugify(input.locality) : null;

  return joinSlugParts([bedrooms, type, locality, id]);
}
