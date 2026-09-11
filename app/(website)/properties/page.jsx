import { redirect } from "next/navigation";
import {
  findBudgetBand,
  getProperties,
  getPropertyLocalities,
  legacyTypeToFilters,
  parsePropertyFilters,
  resolveLocalitySlug,
  serializePropertyFilters,
  toCmsPurpose,
} from "../../../lib/properties";
import PropertiesListing from "../../../components/properties/PropertiesListing";

const title = "Properties";
const description =
  "Explore residential and commercial properties across Mumbai's Western Suburbs, selected by Rajasthan Estate Realtors.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/properties",
  },
  openGraph: {
    title,
    description,
    url: "/properties",
  },
};

export default async function PropertiesPage({ searchParams }) {
  const params = (await searchParams) ?? {};

  // Older links used a single `type` parameter that conflated purpose and
  // category. Translate once and redirect, so only one dialect reaches the
  // rest of the page.
  const legacy = legacyTypeToFilters(params);
  if (legacy) {
    const merged = { ...parsePropertyFilters(params), ...legacy };
    const query = serializePropertyFilters(merged);
    redirect(query ? `/properties?${query}` : "/properties");
  }

  const filters = parsePropertyFilters(params);
  const purpose = toCmsPurpose(filters.purpose);
  const category = filters.category ?? undefined;

  // Locality options reflect the current purpose/category scope, so the filter
  // never offers a place with nothing behind it.
  const scope = { purpose, category };
  const [localities, activeLocality] = await Promise.all([
    getPropertyLocalities(scope),
    resolveLocalitySlug(filters.locality, scope),
  ]);

  const band = findBudgetBand(filters.purpose, filters.budget);

  const properties = await getProperties({
    purpose,
    category,
    locality: activeLocality?.label,
    bhk: filters.bhk ?? undefined,
    minPrice: band?.min ?? undefined,
    maxPrice: band?.max ?? undefined,
  });

  return (
    <PropertiesListing
      properties={properties}
      filters={filters}
      localities={localities}
      activeLocality={activeLocality}
    />
  );
}
