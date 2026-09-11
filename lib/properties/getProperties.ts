import type { Where } from 'payload';
import type { Property } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapProperty } from './mapProperty';
import { publicStatusWhere } from './publicScope';
import { slugifyLocality } from './filterParams';
import type { PublicProperty } from './types';

const PUBLIC_PROPERTY_DEPTH = 2;
const PUBLIC_PROPERTY_LIMIT = 100;

export type GetPropertiesOptions = {
  purpose?: Property['purpose'];
  category?: NonNullable<Property['propertyCategory']>;
  /** Exact CMS locality value, e.g. "Andheri West". */
  locality?: string;
  bhk?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
};

/**
 * Sale, rent and lease each store their amount in a different field, so a
 * budget can only be applied once the purpose is known. Filtering the wrong
 * field would silently exclude everything.
 */
function priceFieldFor(purpose: Property['purpose'] | undefined): string | null {
  if (purpose === 'sale') {
    return 'pricing.price';
  }

  if (purpose === 'rent') {
    return 'pricing.rentAmount';
  }

  if (purpose === 'lease') {
    return 'pricing.monthlyLeasePayment';
  }

  return null;
}

function publicPropertiesWhere(options: GetPropertiesOptions): Where {
  const { purpose, category, locality, bhk, minPrice, maxPrice } = options;
  const clauses: Where[] = [publicStatusWhere()];

  if (purpose) {
    clauses.push({ purpose: { equals: purpose } });
  }

  if (category) {
    clauses.push({ propertyCategory: { equals: category } });
  }

  if (locality) {
    clauses.push({ 'location.locality': { equals: locality } });
  }

  if (typeof bhk === 'number') {
    clauses.push({ 'details.bedrooms': { equals: bhk } });
  }

  const priceField = priceFieldFor(purpose);
  if (priceField) {
    if (typeof minPrice === 'number') {
      clauses.push({ [priceField]: { greater_than_equal: minPrice } });
    }

    if (typeof maxPrice === 'number') {
      clauses.push({ [priceField]: { less_than: maxPrice } });
    }
  }

  return clauses.length === 1 ? clauses[0] : { and: clauses };
}

export async function getProperties(
  options: GetPropertiesOptions = {},
): Promise<PublicProperty[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'properties',
    where: publicPropertiesWhere(options),
    depth: PUBLIC_PROPERTY_DEPTH,
    limit: PUBLIC_PROPERTY_LIMIT,
    overrideAccess: false,
    sort: '-updatedAt',
  });

  return result.docs
    .map((doc) => mapProperty(doc as Property))
    .filter((property): property is PublicProperty => property !== null);
}

export type LocalityOption = {
  value: string;
  label: string;
  count: number;
};

/**
 * Locality options come from the inventory that is actually published, so the
 * filter can never offer a place with nothing behind it.
 */
export async function getPropertyLocalities(
  options: Pick<GetPropertiesOptions, 'purpose' | 'category'> = {},
): Promise<LocalityOption[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'properties',
    where: publicPropertiesWhere(options),
    depth: 0,
    limit: PUBLIC_PROPERTY_LIMIT,
    overrideAccess: false,
  });

  const byValue = new Map<string, LocalityOption>();

  for (const doc of result.docs as Property[]) {
    const label = doc.location?.locality?.trim();
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
