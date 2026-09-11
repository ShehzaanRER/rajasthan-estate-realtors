"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { budgetBandsFor, propertiesHref } from "../../lib/properties/filterParams";

/**
 * The URL is the only source of truth: every control reads from the parsed
 * filters passed in as props and writes by navigating. Nothing is held in
 * local state, so a reloaded or shared link always reproduces the same view.
 */

const PRIMARY_TABS = [
  { key: "all", label: "All", filters: {} },
  { key: "buy", label: "Buy", filters: { purpose: "buy", category: "residential" } },
  { key: "rent", label: "Rent", filters: { purpose: "rent", category: "residential" } },
  { key: "commercial", label: "Commercial", filters: { category: "commercial" } },
];

function activeTabKey(filters) {
  if (filters.category === "commercial") {
    return "commercial";
  }

  if (filters.category === "residential" && filters.purpose === "buy") {
    return "buy";
  }

  if (filters.category === "residential" && filters.purpose === "rent") {
    return "rent";
  }

  if (!filters.purpose && !filters.category) {
    return "all";
  }

  return null;
}

const COMMERCIAL_PURPOSES = [
  { key: null, label: "All" },
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
];

const selectClasses =
  "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F]";

// min-h keeps the tap target at the 44px touch minimum; the extra height is
// padding above the label, so the underline still sits tight to the text.
function tabClasses(isActive) {
  return [
    "inline-flex min-h-[44px] items-end border-b-2 pb-2 text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-200",
    isActive
      ? "border-[#B8862F] text-[#081221]"
      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-[#081221]",
  ].join(" ");
}

function PropertyFilterBar({ filters, localities, resultCount }) {
  const router = useRouter();
  const currentTab = activeTabKey(filters);
  const isCommercial = filters.category === "commercial";
  const isResidential = filters.category === "residential" || !filters.category;
  const budgets = budgetBandsFor(filters.purpose);

  // Secondary filters are scoped to the active purpose/category, so they are
  // reset when the primary tab changes rather than silently emptying results.
  const update = (changes) => {
    router.push(propertiesHref({ ...filters, ...changes }));
  };

  const hasSecondaryFilter = Boolean(filters.locality || filters.bhk || filters.budget);

  return (
    <div className="border-y border-slate-200">

      {/* PRIMARY */}

      <div className="flex flex-wrap items-end gap-x-7 gap-y-3 pt-5">
        {PRIMARY_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={propertiesHref(tab.filters)}
            aria-current={currentTab === tab.key ? "page" : undefined}
            className={tabClasses(currentTab === tab.key)}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* SECONDARY */}

      <div className="flex flex-wrap items-center gap-3 py-5">

        {isCommercial ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              Looking to
            </span>

            {COMMERCIAL_PURPOSES.map((option) => {
              const isActive = (filters.purpose ?? null) === option.key;

              return (
                <Link
                  key={option.label}
                  href={propertiesHref({
                    category: "commercial",
                    ...(option.key ? { purpose: option.key } : {}),
                  })}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex min-h-[40px] items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
                    isActive
                      ? "border-[#B8862F] bg-[#B8862F] text-white"
                      : "border-slate-300 text-slate-600 hover:border-[#B8862F] hover:text-[#B8862F]",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        ) : null}

        {localities.length > 1 ? (
          <label className="flex items-center gap-2">
            <span className="sr-only">Locality</span>
            <select
              value={filters.locality ?? ""}
              onChange={(event) => update({ locality: event.target.value || null })}
              className={selectClasses}
            >
              <option value="">All localities</option>
              {localities.map((locality) => (
                <option key={locality.value} value={locality.value}>
                  {locality.label} ({locality.count})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {/* BHK is meaningless for offices and shops, so it only appears on
            residential views. */}
        {isResidential ? (
          <label className="flex items-center gap-2">
            <span className="sr-only">Bedrooms</span>
            <select
              value={filters.bhk ?? ""}
              onChange={(event) =>
                update({ bhk: event.target.value ? Number(event.target.value) : null })
              }
              className={selectClasses}
            >
              <option value="">Any BHK</option>
              {[1, 2, 3, 4].map((bhk) => (
                <option key={bhk} value={bhk}>
                  {bhk} BHK
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {budgets.length > 0 ? (
          <label className="flex items-center gap-2">
            <span className="sr-only">Budget</span>
            <select
              value={filters.budget ?? ""}
              onChange={(event) => update({ budget: event.target.value || null })}
              className={selectClasses}
            >
              <option value="">Any budget</option>
              {budgets.map((band) => (
                <option key={band.value} value={band.value}>
                  {band.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="ml-auto text-sm text-slate-500">
          {resultCount} {resultCount === 1 ? "property" : "properties"}
        </p>

        {hasSecondaryFilter ? (
          <button
            type="button"
            onClick={() => update({ locality: null, bhk: null, budget: null })}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-[#B8862F] underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        ) : null}

      </div>

    </div>
  );
}

export default PropertyFilterBar;
