import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PropertyCard from "./PropertyCard";
import PropertyFilterBar from "./PropertyFilterBar";
import { describeFilters, propertiesHref } from "../../lib/properties/filterParams";
import { CONTACT_PHONE_TEL, CONTACT_WHATSAPP_NUMBER } from "../../lib/siteConfig";

/** Sends the enquiry to /contact already set to the thing the visitor was looking at. */
function contactIntentFor(filters) {
  if (filters.category === "commercial") {
    return "commercial-property";
  }

  if (filters.purpose === "rent" || filters.purpose === "lease") {
    return "rent-property";
  }

  if (filters.purpose === "buy") {
    return "buy-property";
  }

  return "general-enquiry";
}

/** Empty-state copy that names what was actually searched for. */
function emptyStateCopy(filters, localityLabel) {
  const place = localityLabel ? ` in ${localityLabel}` : "";

  if (filters.category === "commercial" && filters.purpose === "rent") {
    return `No commercial properties are currently available to rent${place}.`;
  }

  if (filters.category === "commercial") {
    return `No commercial properties are currently listed${place}.`;
  }

  if (filters.purpose === "rent") {
    const bhk = filters.bhk ? `${filters.bhk} BHK ` : "";
    return `No ${bhk}rentals are currently available${place}.`;
  }

  if (filters.purpose === "buy") {
    const bhk = filters.bhk ? `${filters.bhk} BHK ` : "";
    return `No ${bhk}properties are currently for sale${place}.`;
  }

  return `No properties match these filters${place}.`;
}

function PropertiesListing({ properties, filters, localities, activeLocality }) {
  const count = properties.length;
  const localityLabel = activeLocality?.label ?? null;
  const summary = describeFilters(filters, localityLabel);
  const intent = contactIntentFor(filters);

  const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to know more about properties with Rajasthan Estate Realtors.",
  )}`;

  const hasAnyFilter = Boolean(
    filters.purpose || filters.category || filters.locality || filters.bhk || filters.budget,
  );

  return (
    <main className="bg-white">
      <section className="bg-[#081221]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 md:px-16 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-6xl">
              Properties in Mumbai&apos;s
              <span className="block italic text-[#D4AF37]">Western Suburbs.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-light leading-8 text-slate-300">
              Residential and commercial properties available through Rajasthan
              Estate Realtors, across Jogeshwari, Andheri, Goregaon and the
              surrounding areas.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-10 md:px-16 lg:px-8">

          <PropertyFilterBar
            filters={filters}
            localities={localities}
            resultCount={count}
          />

          {/* Active state — a filtered view must never look like the full list. */}
          <div className="mt-6 mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
              {summary}
            </h2>

            {hasAnyFilter ? (
              <Link
                href={propertiesHref({})}
                className="inline-block py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#B8862F] underline-offset-4 hover:underline"
              >
                View all properties
              </Link>
            ) : null}
          </div>

          {count === 0 ? (
            <div className="border border-slate-200 bg-[#F7F5F1] px-8 py-14 text-center sm:px-12">
              <p className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
                {emptyStateCopy(filters, localityLabel)}
              </p>

              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                Not everything we handle is listed online. Tell us what you are
                looking for and we will let you know what is available.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/contact?intent=${intent}`}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:bg-[#14233A]"
                >
                  Tell Us What You Need
                  <ArrowRight size={16} />
                </Link>

                {hasAnyFilter ? (
                  <Link
                    href={propertiesHref({})}
                    className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
                  >
                    View All Properties
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.slug}
                  property={property}
                  priority={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#F5F0E8] py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">
          <h2 className="font-serif text-3xl font-light leading-tight text-[#081221] sm:text-4xl">
            Looking for something you haven&apos;t found here?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            We often know of properties before they are listed. Tell us what you
            need and we will help you find it.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
            >
              Speak With Us
              <ArrowRight size={18} />
            </a>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PropertiesListing;
