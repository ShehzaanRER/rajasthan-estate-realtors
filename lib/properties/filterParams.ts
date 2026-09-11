import type { Property } from '../../payload-types';

/**
 * Single source of truth for property listing URL semantics.
 *
 * `purpose` (sale/rent/lease) and `propertyCategory` (residential/commercial)
 * are independent dimensions in the CMS, so they stay independent in the URL
 * too. A single combined parameter cannot express "commercial to rent", and
 * previously silently returned sale listings for that request.
 */

export type PurposeParam = 'buy' | 'rent' | 'lease';
export type CategoryParam = 'residential' | 'commercial';

export type PropertyFilters = {
  purpose: PurposeParam | null;
  category: CategoryParam | null;
  locality: string | null;
  bhk: number | null;
  budget: string | null;
};

const PURPOSE_PARAMS: PurposeParam[] = ['buy', 'rent', 'lease'];
const CATEGORY_PARAMS: CategoryParam[] = ['residential', 'commercial'];

const PURPOSE_TO_CMS: Record<PurposeParam, Property['purpose']> = {
  buy: 'sale',
  rent: 'rent',
  lease: 'lease',
};

export const PURPOSE_LABELS: Record<PurposeParam, string> = {
  buy: 'Buy',
  rent: 'Rent',
  lease: 'Lease',
};

export const CATEGORY_LABELS: Record<CategoryParam, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
};

/**
 * Budget bands differ by purpose: a sale band measured in crore is meaningless
 * against a monthly rent. Each band carries the raw rupee bounds used for the
 * query, never a formatted string.
 */
export type BudgetBand = {
  value: string;
  label: string;
  min: number | null;
  max: number | null;
};

const SALE_BUDGETS: BudgetBand[] = [
  { value: 'under-50l', label: 'Under ₹50 Lakh', min: null, max: 5_000_000 },
  { value: '50l-1cr', label: '₹50 Lakh – ₹1 Cr', min: 5_000_000, max: 10_000_000 },
  { value: '1cr-2cr', label: '₹1 Cr – ₹2 Cr', min: 10_000_000, max: 20_000_000 },
  { value: '2cr-5cr', label: '₹2 Cr – ₹5 Cr', min: 20_000_000, max: 50_000_000 },
  { value: '5cr-plus', label: '₹5 Cr and above', min: 50_000_000, max: null },
];

const RENT_BUDGETS: BudgetBand[] = [
  { value: 'under-25k', label: 'Under ₹25,000', min: null, max: 25_000 },
  { value: '25k-50k', label: '₹25,000 – ₹50,000', min: 25_000, max: 50_000 },
  { value: '50k-1l', label: '₹50,000 – ₹1 Lakh', min: 50_000, max: 100_000 },
  { value: '1l-plus', label: '₹1 Lakh and above', min: 100_000, max: null },
];

export function budgetBandsFor(purpose: PurposeParam | null): BudgetBand[] {
  if (purpose === 'buy') {
    return SALE_BUDGETS;
  }

  if (purpose === 'rent' || purpose === 'lease') {
    return RENT_BUDGETS;
  }

  return [];
}

export function findBudgetBand(purpose: PurposeParam | null, value: string | null): BudgetBand | null {
  if (!value) {
    return null;
  }

  return budgetBandsFor(purpose).find((band) => band.value === value) ?? null;
}

export function slugifyLocality(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function readParam(params: Record<string, string | string[] | undefined>, key: string): string | null {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Older links used a single `type` parameter that conflated purpose and
 * category. Returns the equivalent modern filters, or null when the parameter
 * is absent, so the route can redirect once rather than support two dialects.
 */
export function legacyTypeToFilters(
  params: Record<string, string | string[] | undefined>,
): Partial<PropertyFilters> | null {
  const type = readParam(params, 'type');

  if (!type) {
    return null;
  }

  if (type === 'buy') {
    return { purpose: 'buy', category: 'residential' };
  }

  if (type === 'rent') {
    return { purpose: 'rent', category: 'residential' };
  }

  if (type === 'commercial') {
    return { category: 'commercial' };
  }

  // Unrecognised value: drop it rather than guessing.
  return {};
}

export function parsePropertyFilters(
  params: Record<string, string | string[] | undefined>,
): PropertyFilters {
  const purposeRaw = readParam(params, 'for');
  const categoryRaw = readParam(params, 'category');
  const bhkRaw = readParam(params, 'bhk');
  const localityRaw = readParam(params, 'locality');

  const purpose = PURPOSE_PARAMS.includes(purposeRaw as PurposeParam)
    ? (purposeRaw as PurposeParam)
    : null;

  const bhkParsed = bhkRaw ? Number.parseInt(bhkRaw, 10) : Number.NaN;

  const budget = readParam(params, 'budget');

  return {
    purpose,
    category: CATEGORY_PARAMS.includes(categoryRaw as CategoryParam)
      ? (categoryRaw as CategoryParam)
      : null,
    locality: localityRaw ? slugifyLocality(localityRaw) : null,
    bhk: Number.isInteger(bhkParsed) && bhkParsed > 0 ? bhkParsed : null,
    // Only keep a budget that belongs to the active purpose — a sale band
    // carried into a rent view would filter against the wrong field.
    budget: findBudgetBand(purpose, budget)?.value ?? null,
  };
}

/** Serialises filters back to a query string, omitting every empty value. */
export function serializePropertyFilters(filters: Partial<PropertyFilters>): string {
  const params = new URLSearchParams();

  if (filters.purpose) {
    params.set('for', filters.purpose);
  }

  if (filters.category) {
    params.set('category', filters.category);
  }

  if (filters.locality) {
    params.set('locality', filters.locality);
  }

  if (typeof filters.bhk === 'number' && filters.bhk > 0) {
    params.set('bhk', String(filters.bhk));
  }

  if (filters.budget) {
    params.set('budget', filters.budget);
  }

  return params.toString();
}

export function propertiesHref(filters: Partial<PropertyFilters>): string {
  const query = serializePropertyFilters(filters);
  return query ? `/properties?${query}` : '/properties';
}

export function toCmsPurpose(purpose: PurposeParam | null): Property['purpose'] | undefined {
  return purpose ? PURPOSE_TO_CMS[purpose] : undefined;
}

/** Human-readable summary of the active filters, for the listing header. */
export function describeFilters(
  filters: PropertyFilters,
  localityLabel: string | null,
): string {
  const category = filters.category ? CATEGORY_LABELS[filters.category] : null;

  // "2 BHK rentals in Malad West" reads better than "Rentals 2 BHK", so the
  // configuration qualifies the subject rather than trailing it.
  const bhk = filters.bhk ? `${filters.bhk} BHK ` : '';

  let subject: string;
  if (filters.purpose === 'lease') {
    subject = category === 'Commercial'
      ? 'Commercial properties to lease'
      : `${bhk}properties to lease`;
  } else if (filters.purpose === 'rent') {
    subject = category === 'Commercial' ? 'Commercial properties to rent' : `${bhk}rentals`;
  } else if (filters.purpose === 'buy') {
    subject = category === 'Commercial'
      ? 'Commercial properties for sale'
      : `${bhk}properties for sale`;
  } else if (category) {
    subject = `${category} properties`;
  } else {
    subject = bhk ? `${bhk}properties` : 'All properties';
  }

  const parts = [subject.charAt(0).toUpperCase() + subject.slice(1)];

  if (localityLabel) {
    parts.push(`in ${localityLabel}`);
  }

  const band = findBudgetBand(filters.purpose, filters.budget);
  if (band) {
    parts.push(`· ${band.label}`);
  }

  return parts.join(' ');
}
