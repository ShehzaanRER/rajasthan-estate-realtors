import type { Listing } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { onePerProperty } from '../listings/publicSelection';
import { MAX_LISTINGS_PER_PROPERTY, findPublicListings, toPublicProperties } from './getPublicListings';
import { publicListingsWhere, type GetPropertiesOptions } from './listingsWhere';
import { publicStatusWhere } from './publicScope';
import { slugifyLocality } from './filterParams';
import type { PublicProperty } from './types';

const PUBLIC_PROPERTY_LIMIT = 100;

/**
 * Public search. Returns one entry per PHYSICAL PROPERTY:
 *
 *  - a Buy search returns eligible sale listings, a Rent search eligible rental
 *    listings, each with its own price and terms;
 *  - a property with both appears in both searches;
 *  - an unfiltered search returns it once (as its Sale listing) with the rental
 *    listed under `otherListings`, rather than as two cards.
 */
export async function getProperties(
  options: GetPropertiesOptions = {},
): Promise<PublicProperty[]> {
  const listings = await findPublicListings({
    where: publicListingsWhere(options),
    limit: PUBLIC_PROPERTY_LIMIT * MAX_LISTINGS_PER_PROPERTY,
  });

  return toPublicProperties(listings, PUBLIC_PROPERTY_LIMIT);
}

export type LocalityOption = {
  value: string;
  label: string;
  count: number;
};

/**
 * Locality options come from the inventory that is actually published, so the
 * filter can never offer a place with nothing behind it. `count` is the number
 * of distinct properties — a flat for sale and for rent is one property.
 */
export async function getPropertyLocalities(
  options: Pick<GetPropertiesOptions, 'purpose' | 'category'> = {},
): Promise<LocalityOption[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'listings',
    where: publicListingsWhere(options),
    depth: 1,
    limit: PUBLIC_PROPERTY_LIMIT * MAX_LISTINGS_PER_PROPERTY,
    overrideAccess: false,
    select: { property: true, transactionType: true },
  });

  const properties = onePerProperty(
    result.docs as Listing[],
    (listing) => (typeof listing.property === 'object' && listing.property ? listing.property.id : null),
    (listing) => listing.transactionType,
  );

  const byValue = new Map<string, LocalityOption>();

  for (const listing of properties) {
    const property = typeof listing.property === 'object' ? listing.property : null;
    const label = property?.location?.locality?.trim();
    if (!label) {
      continue;
    }

    const value = slugifyLocality(label);
    const existing = byValue.get(value);

    if (existing) {
      existing.count += 1;
      continue;
    }

    byValue.set(value, { value, label, count: 1 });
  }

  return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Resolves a URL locality slug back to the exact CMS value it represents. */
export async function resolveLocalitySlug(
  slug: string | null,
  options: Pick<GetPropertiesOptions, 'purpose' | 'category'> = {},
): Promise<LocalityOption | null> {
  if (!slug) {
    return null;
  }

  const localities = await getPropertyLocalities(options);
  return localities.find((locality) => locality.value === slug) ?? null;
}
