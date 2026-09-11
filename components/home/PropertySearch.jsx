"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { budgetBandsFor, propertiesHref } from "../../lib/properties/filterParams";
import { CONTACT_WHATSAPP_NUMBER } from "../../lib/siteConfig";

function buildSellMessage({ category, locality, budget }) {
  const parts = ["Hi, I'm looking to sell a property."];

  if (category) {
    parts.push(`Property type: ${category}.`);
  }

  if (locality) {
    parts.push(`Location: ${locality}.`);
  }

  if (budget) {
    parts.push(`Expected value range: ${budget}.`);
  }

  return parts.join(" ");
}

const fieldClasses =
  "h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] sm:h-14 sm:px-4 md:text-sm";

const labelClasses =
  "mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:mb-2 sm:text-xs sm:tracking-[0.18em]";

/**
 * Every control here carries into the resulting URL. Location and budget were
 * previously collected and silently discarded, so a visitor who asked for a
 * ₹1–2 Cr flat in Jogeshwari was shown everything for sale.
 *
 * Locality options come from real published inventory (passed in from the
 * server) rather than a hardcoded list.
 */
function PropertySearch({ localities = [] }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState("buy");
  const [category, setCategory] = useState("residential");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState("");

  const isSelling = purpose === "sell";

  // Budget bands are purpose-specific: crore bands are meaningless for rent.
  const budgets = useMemo(
    () => budgetBandsFor(isSelling ? "buy" : purpose),
    [purpose, isSelling],
  );

  const handlePurposeChange = (value) => {
    setPurpose(value);
    // A sale band cannot be applied to a rent query, so drop it on switch
    // rather than carrying an option that no longer exists.
    setBudget("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const localityLabel =
      localities.find((option) => option.value === locality)?.label ?? "";
    const budgetLabel = budgets.find((band) => band.value === budget)?.label ?? "";

    if (isSelling) {
      const message = buildSellMessage({
        category: category === "commercial" ? "Commercial" : "Residential",
        locality: localityLabel,
        budget: budgetLabel,
      });

      window.open(
        `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    router.push(
      propertiesHref({
        purpose,
        category,
        locality: locality || null,
        budget: budget || null,
      }),
    );
  };

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-6 max-w-2xl sm:mb-8">
          <h2 className="font-cormorant text-4xl font-semibold tracking-tight text-[#081221] sm:text-5xl">
            Find your next property
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Tell us what you are looking for and we will show you what is
            available across the Western Suburbs.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(8,18,33,0.08)] sm:p-8"
        >
          {/* 2 x 2 on a phone — four stacked controls made this the tallest
              block on the homepage without adding any information. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">

            <div className="flex flex-col">
              <label htmlFor="property-search-purpose" className={labelClasses}>
                Looking To
              </label>

              <select
                id="property-search-purpose"
                className={fieldClasses}
                value={purpose}
                onChange={(event) => handlePurposeChange(event.target.value)}
              >
                <option value="buy">Buy</option>
                <option value="rent">Rent</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="property-search-category" className={labelClasses}>
                Property Type
              </label>

              <select
                id="property-search-category"
                className={fieldClasses}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="property-search-locality" className={labelClasses}>
                Location
              </label>

              <select
                id="property-search-locality"
                className={fieldClasses}
                value={locality}
                onChange={(event) => setLocality(event.target.value)}
              >
                <option value="">All locations</option>
                {localities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="property-search-budget" className={labelClasses}>
                {purpose === "rent" ? "Monthly Budget" : "Budget"}
              </label>

              <select
                id="property-search-budget"
                className={fieldClasses}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              >
                <option value="">Any budget</option>
                {budgets.map((band) => (
                  <option key={band.value} value={band.value}>
                    {band.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-5 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-5 sm:mt-6 sm:flex-row sm:pt-6">
            <p className="text-center text-sm text-slate-500 sm:text-left">
              Not everything we handle is listed online.
              <span className="ml-1 font-medium text-[#081221]">
                Speak with our team.
              </span>
            </p>

            <button
              type="submit"
              className="group inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_12px_30px_rgba(184,134,47,0.25)] sm:w-auto"
            >
              {isSelling ? "Contact Us" : "Search Properties"}

              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>

        </form>

      </div>
    </section>
  );
}

export default PropertySearch;
