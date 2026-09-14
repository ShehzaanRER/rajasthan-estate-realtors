import type { CollectionBeforeChangeHook } from 'payload';
import { buildPropertySlug } from '../../lib/properties/slug';

/**
 * Fills in a property's public slug on create, so staff never have to invent a
 * URL by hand.
 *
 * ## Inert on anything that already has a slug
 *
 * This is the whole safety property. The hook returns untouched when the
 * operation is not `create`, and when a slug was supplied. It therefore cannot
 * rewrite, normalise or migrate an existing URL — including the pre-existing
 * records whose slugs are mixed-case (`New1`, `Andheri`). Those stay exactly as
 * they are, and stay reachable, because nothing here ever runs against them.
 *
 * Editing a property's title, locality, BHK, purpose or price after creation
 * likewise leaves the slug alone: the `operation !== 'create'` guard is the
 * first thing checked. A published URL is a promise.
 *
 * ## Ordering
 *
 * Registered in `beforeChange` **after** `assignPropertyId`, which is what
 * populates `data.propertyId` from the Postgres sequence. Collection-level
 * `beforeChange` hooks run in array order, and — importantly — the whole
 * collection-level pass runs *before* field validation, which Payload performs
 * during its field-level `beforeChange` traversal. So the slug is present by
 * the time the `required` / format check on the field runs.
 *
 * That ordering is why this is a `beforeChange` hook and not `beforeValidate`:
 * `propertyId` does not exist yet during `beforeValidate`.
 */
export const assignPropertySlug: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation !== 'create') {
    return data;
  }

  // A slug typed by staff wins. Validation on the field has already constrained
  // its shape, so there is nothing to correct here.
  if (typeof data.slug === 'string' && data.slug.trim()) {
    return data;
  }

  const slug = buildPropertySlug({
    propertyId: data.propertyId,
    propertyType: data.propertyType,
    locality: data.location?.locality,
    bedrooms: data.details?.bedrooms,
  });

  // `null` means `propertyId` was missing, which should be impossible after
  // assignPropertyId. Leave the field empty rather than writing a slug that is
  // not unique — the field's own `required` check then reports it honestly.
  if (slug) {
    data.slug = slug;
  }

  return data;
};
