"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { budgetBandsFor, propertiesHref } from "../../lib/properties/filterParams";

const fieldClasses =
  "h-11 rounded-lg border border-rer-navy/15 bg-white px-3 text-sm font-medium text-rer-navy outline-none transition focus:border-rer-gold focus:ring-1 focus:ring-rer-gold";

const labelClasses =
  "mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rer-navy/55";

/**
 * Compact search panel embedded at the base of the hero. Purpose options are
 * exactly the canonical `for=buy|rent|lease` model from filterParams.ts —
 * "Sell" is a distinct seller-enquiry flow (see Services), not a listing
 * filter, so it never appears here.
 */
function HeroPropertySearch({ localities = [] }) {
  const router = useRouter();
  const [purpose, setPurpose] = useState("buy");
  const [category, setCategory] = useState("residential");
  const [locality, setLocality] = useState("");
  const [budget, setBudget] = useState("");

  const handlePurposeChange = (value) => {
    setPurpose(value);
    // Sale and rental bands use different value slugs (rent and lease share
    // theirs), so a budget that no longer belongs to the new purpose's bands
    // is dropped rather than silently carried into a query it can't answer.
    setBudget((current) =>
      budgetBandsFor(value).some((band) => band.value === current) ? current : "",
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    router.push(
      propertiesHref({
        purpose,
        category,
        locality: locality || null,
        budget: budget || null,
      }),
    );
  };

  const budgets = budgetBandsFor(purpose);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-rer-navy/10 bg-[#F7F5F1] p-4 shadow-[0_20px_45px_rgba(8,18,33,0.35)] sm:p-5"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:items-end lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:gap-4">
        <div className="flex flex-col">
          <label htmlFor="hero-search-purpose" className={labelClasses}>
            Looking To
          </label>

          <select
            id="hero-search-purpose"
            className={fieldClasses}
            value={purpose}
            onChange={(event) => handlePurposeChange(event.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="rent">Rent</option>
            <option value="lease">Lease</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="hero-search-category" className={labelClasses}>
            Property Type
          </label>

          <select
            id="hero-search-category"
            className={fieldClasses}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="hero-search-locality" className={labelClasses}>
            Location
          </label>

          <select
            id="hero-search-locality"
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
          <label htmlFor="hero-search-budget" className={labelClasses}>
            Budget
          </label>

          <select
            id="hero-search-budget"
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

        <button
          type="submit"
          className="group col-span-2 mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-rer-gold px-6 text-xs font-semibold uppercase tracking-[0.14em] text-rer-navy transition-all duration-300 hover:-translate-y-0.5 hover:bg-rer-gold-hover hover:shadow-[0_10px_25px_rgba(184,134,47,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rer-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-rer-sand-deep md:col-span-4 md:mt-0 lg:col-span-1 lg:w-auto lg:self-end"
        >
          Search Properties
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}

export default HeroPropertySearch;
