import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
} from "lucide-react";
import PropertyGallery from "./PropertyGallery";
import SimilarProperties from "./SimilarProperties";
import { CONTACT_PHONE_TEL, CONTACT_WHATSAPP_NUMBER } from "../../lib/siteConfig";

function whatsappHref(property) {
  const text = `Hi Rajasthan Estate Realtors, I'm interested in ${property.title} in ${property.locationDisplay}. Property ID: ${property.propertyId}. Please share more details.`;
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function mapsHref(mapsQuery) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
}

const PURPOSE_LABELS = {
  sale: "For Sale",
  rent: "For Rent",
  lease: "For Lease",
};

/** A specific unit has an asking price, never a "starting from". */
function priceHeading(purpose) {
  if (purpose === "rent") {
    return "Monthly Rent";
  }

  if (purpose === "lease") {
    return "Lease";
  }

  return "Asking Price";
}

/** Tags worth surfacing alongside — never instead of — the transaction type. */
const HIGHLIGHT_TAGS = [
  ["premium", "Premium"],
  ["new", "New"],
  ["price-reduced", "Price Reduced"],
];

function highlightTag(tags = []) {
  const match = HIGHLIGHT_TAGS.find(([tag]) => tags.includes(tag));
  return match ? match[1] : null;
}

function PropertyDetail({ property, similarProperties = [] }) {
  const typeLabel = property.propertyTypeLabel || property.categoryLabel;
  const hasBedrooms = typeof property.bedrooms === "number";
  const hasBathrooms = typeof property.bathrooms === "number";
  const specCells = [];

  if (property.areaDisplay) {
    specCells.push({
      key: "area",
      icon: <Maximize size={19} className="text-[#B8862F]" />,
      label: "Area",
      value: property.areaDisplay,
    });
  }

  if (hasBedrooms) {
    specCells.push({
      key: "bedrooms",
      icon: <BedDouble size={19} className="text-[#B8862F]" />,
      label: "Bedrooms",
      value: String(property.bedrooms),
    });
  }

  if (hasBathrooms) {
    specCells.push({
      key: "bathrooms",
      icon: <Bath size={19} className="text-[#B8862F]" />,
      label: "Bathrooms",
      value: String(property.bathrooms),
    });
  }

  specCells.push({
    key: "status",
    icon: null,
    label: "Status",
    value: property.statusLabel,
  });

  const specColumns =
    specCells.length >= 4
      ? "sm:grid-cols-4"
      : specCells.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  const enquiryWhatsapp = whatsappHref(property);
  const locationMapsHref = mapsHref(property.location.mapsQuery);
  const detailsRows = property.detailsRows ?? [];
  const amenityNames = property.amenityNames ?? [];
  const nearby = property.nearbyConnectivity ?? [];
  const hasOverviewCopy = Boolean(property.descriptionHtml || property.descriptionText);
  const tag = highlightTag(property.tags);
  const purposeLabel = PURPOSE_LABELS[property.purpose] ?? "For Sale";

  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-[#F7F5F1]">
        <div className="mx-auto max-w-7xl px-6 py-5 sm:px-10 md:px-16 lg:px-8">
          <Link
            href="/properties"
            className="group inline-flex min-h-11 items-center gap-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#B8862F] md:min-h-0 md:py-0"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Properties
          </Link>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <PropertyGallery images={property.images} title={property.title} />
        </div>
      </section>

      <section className="bg-white pb-12 sm:pb-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              {/* Transaction type always leads. A tag such as "Premium"
                  previously took this slot, leaving the visitor unable to tell
                  whether the property was for sale or for rent. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex bg-[#081221] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                  {purposeLabel}
                </span>

                {tag ? (
                  <span className="inline-flex bg-[#B8862F] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                    {tag}
                  </span>
                ) : null}

                {typeLabel ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {typeLabel}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 font-serif text-3xl font-medium leading-tight text-[#081221] sm:text-4xl md:text-5xl">
                {property.title}
              </h1>

              {property.locationDisplay ? (
                <div className="mt-4 flex items-center gap-2 text-base text-slate-500">
                  <MapPin size={18} className="shrink-0 text-[#B8862F]" />
                  {property.locationDisplay}
                </div>
              ) : null}

              {/* Price sits in the primary reading flow, so it is answered
                  before the fold on mobile rather than below the spec grid. */}
              <div className="mt-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  {priceHeading(property.purpose)}
                </p>
                <p className="mt-1 font-serif text-4xl text-[#081221]">
                  {property.pricing.displayPrice}
                </p>
                {property.pricing.negotiable ? (
                  <p className="mt-1 text-sm text-slate-500">Negotiable</p>
                ) : null}
              </div>

              {specCells.length > 0 ? (
                <div
                  className={`mt-8 grid max-w-2xl grid-cols-2 border-y border-slate-200 ${specColumns}`}
                >
                  {specCells.map((cell, index) => {
                    const isLast = index === specCells.length - 1;

                    return (
                      <div
                        key={cell.key}
                        className={`px-5 py-5 first:pl-0 ${isLast ? "sm:pr-0" : "border-r border-slate-200"}`}
                      >
                        {cell.icon}
                        <p
                          className={`${cell.icon ? "mt-3" : ""} text-[10px] uppercase tracking-[0.15em] text-slate-400`}
                        >
                          {cell.label}
                        </p>
                        <p className={`${cell.icon ? "mt-1" : "mt-4"} text-sm font-medium text-[#081221]`}>
                          {cell.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* One enquiry card. Price is not repeated here — it is already
                answered above, and two copies invited them to disagree. */}
            <aside className="border border-slate-200 bg-[#F7F5F1] p-7 lg:sticky lg:top-6">
              <p className="font-serif text-2xl text-[#081221]">
                Interested in this property?
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Speak with our team about availability, further details and
                arranging a viewing.
              </p>

              <a
                href={`tel:${CONTACT_PHONE_TEL}`}
                className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-[#14233A]"
              >
                <Phone size={17} />
                Speak With Us
              </a>

              <a
                href={enquiryWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
              >
                <MessageCircle size={17} />
                WhatsApp Us
              </a>

              <p className="mt-5 text-xs text-slate-500">
                Property ID {property.propertyId}
              </p>
            </aside>
          </div>
        </div>
      </section>

      {hasOverviewCopy || detailsRows.length > 0 ? (
        <section className="bg-[#F7F5F1] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              {hasOverviewCopy ? (
                <div>
                  <h2 className="font-serif text-3xl text-[#081221]">
                    About this property
                  </h2>

                  {property.descriptionHtml ? (
                    <div
                      className="property-description mt-5 max-w-2xl"
                      dangerouslySetInnerHTML={{ __html: property.descriptionHtml }}
                    />
                  ) : (
                    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                      {property.descriptionText}
                    </p>
                  )}
                </div>
              ) : null}

              {detailsRows.length > 0 ? (
                <div>
                  <h2 className="font-serif text-3xl text-[#081221]">
                    Property details
                  </h2>

                  <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {detailsRows.map((detail, index) => (
                      <div
                        key={`${detail.label}-${index}`}
                        className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      >
                        <span className="text-sm text-slate-500">
                          {detail.label}
                        </span>
                        <span className="text-sm font-medium text-[#081221] sm:text-right">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {amenityNames.length > 0 ? (
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <h2 className="mb-8 font-serif text-3xl text-[#081221]">
              Amenities
            </h2>

            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {amenityNames.map((amenity, index) => (
                <div key={`${amenity}-${index}`} className="bg-white px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8862F]" />
                    <p className="text-sm font-medium text-[#081221]">
                      {amenity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {nearby.length > 0 ? (
        <section className="bg-[#F7F5F1] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <h2 className="mb-8 font-serif text-3xl text-[#081221]">
              What&apos;s nearby
            </h2>

            <div className="grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-2">
              {nearby.map((connection, index) => {
                const metrics = [connection.distanceDisplay, connection.travelTimeDisplay]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={`${connection.name}-${index}`}
                    className="bg-white px-6 py-5"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#B8862F]">
                      {connection.categoryLabel}
                    </p>
                    <p className="mt-2 text-base font-medium text-[#081221]">
                      {connection.name}
                    </p>
                    {metrics ? (
                      <p className="mt-1 text-sm text-slate-500">{metrics}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Location: the decorative panel that previously sat beside this only
          restated the locality next to a large pin icon, so it was removed
          rather than kept as filler. */}
      <section className="bg-[#081221] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl text-white">
              Location
            </h2>

            <p className="mt-4 text-lg text-[#D4AF37]">
              {property.locationDisplay}
            </p>

            {property.location.address ? (
              <p className="mt-3 text-base leading-7 text-slate-300">
                {property.location.address}
              </p>
            ) : null}

            <a
              href={locationMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-3 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#D4AF37] transition-colors hover:text-white md:mt-6 md:min-h-0 md:py-0"
            >
              View on Google Maps
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <SimilarProperties properties={similarProperties} />

      {/* A compact closing prompt, not a second full CTA band. The enquiry card
          above is the primary path; this exists so a visitor who has scrolled
          the whole page still has one to hand. */}
      <section className="border-t border-slate-200 bg-[#F5F0E8] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:px-10 md:flex-row md:px-16 lg:px-8">
          <p className="text-base text-[#081221]">
            Want to see this property or ask a question?
          </p>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors duration-300 hover:bg-[#14233A]"
            >
              <Phone size={16} />
              Speak With Us
            </a>

            <a
              href={enquiryWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#081221]/25 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PropertyDetail;
