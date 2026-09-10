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

function priceHeading(purpose) {
  if (purpose === "rent") {
    return "Rent";
  }

  if (purpose === "lease") {
    return "Lease";
  }

  return "Asking Price";
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
  const locationSubline = [property.location.city, property.location.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-[#F7F5F1]">
        <div className="mx-auto max-w-7xl px-6 py-5 sm:px-10 md:px-16 lg:px-8">
          <Link
            href="/properties"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#B8862F]"
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

      <section className="bg-white pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              {typeLabel ? (
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B8862F]">
                  {typeLabel}
                </p>
              ) : null}

              {property.badge ? (
                <div className="mt-4">
                  <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {property.badge}
                  </span>
                </div>
              ) : null}

              <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-[#081221] sm:text-5xl md:text-6xl">
                {property.title}
              </h1>

              {property.locationDisplay ? (
                <div className="mt-5 flex items-center gap-2 text-base text-slate-500">
                  <MapPin size={18} className="shrink-0 text-[#B8862F]" />
                  {property.locationDisplay}
                </div>
              ) : null}

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

            <aside className="border border-slate-200 bg-[#F7F5F1] p-7 lg:sticky lg:top-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                {priceHeading(property.purpose)}
              </p>
              <p className="mt-2 font-serif text-4xl text-[#081221]">
                {property.pricing.displayPrice}
              </p>

              <div className="my-6 h-px bg-slate-200" />

              <p className="text-sm leading-6 text-slate-600">
                Interested in this property? Speak directly with our property
                experts for availability, additional information and a
                viewing.
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
            </aside>
          </div>
        </div>
      </section>

      {hasOverviewCopy || detailsRows.length > 0 ? (
        <section className="bg-[#F7F5F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <span className="h-px w-10 bg-[#B8862F]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
                    Property Overview
                  </p>
                </div>

                <h2 className="font-serif text-4xl font-light text-[#081221] sm:text-5xl">
                  A closer look at
                  <span className="block italic text-[#B8862F]">
                    this property.
                  </span>
                </h2>

                {property.descriptionHtml ? (
                  <div
                    className="property-description mt-7 max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: property.descriptionHtml }}
                  />
                ) : property.descriptionText ? (
                  <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    {property.descriptionText}
                  </p>
                ) : null}

                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  For complete property information, current availability and
                  viewing arrangements, speak with our team directly.
                </p>
              </div>

              {detailsRows.length > 0 ? (
                <div>
                  <h3 className="font-serif text-3xl text-[#081221]">
                    Property Details
                  </h3>

                  <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                    {detailsRows.map((detail, index) => (
                      <div
                        key={`${detail.label}-${index}`}
                        className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
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
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Features
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Property Amenities
              </h2>
            </div>

            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {amenityNames.map((amenity, index) => (
                <div key={`${amenity}-${index}`} className="bg-white px-6 py-6">
                  <div className="flex items-center gap-4">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#B8862F]" />
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
        <section className="bg-[#F7F5F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Connectivity
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Nearby
              </h2>
            </div>

            <div className="grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-2">
              {nearby.map((connection, index) => {
                const metrics = [connection.distanceDisplay, connection.travelTimeDisplay]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={`${connection.name}-${index}`}
                    className="bg-white px-6 py-6"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#B8862F]">
                      {connection.categoryLabel}
                    </p>
                    <p className="mt-2 text-base font-medium text-[#081221]">
                      {connection.name}
                    </p>
                    {metrics ? (
                      <p className="mt-2 text-sm text-slate-500">{metrics}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#081221] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#D4AF37]">
                  Location
                </p>
              </div>

              <h2 className="font-serif text-4xl font-light text-white sm:text-5xl">
                Located in
                <span className="block italic text-[#D4AF37]">
                  {property.locationDisplay}.
                </span>
              </h2>

              {property.location.address ? (
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  {property.location.address}
                </p>
              ) : (
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  Speak with our team to learn more about the neighbourhood,
                  connectivity, nearby amenities and other factors that may be
                  important to your property decision.
                </p>
              )}

              <a
                href={locationMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#D4AF37] transition-colors hover:text-white"
              >
                View Location
                <ArrowRight size={17} />
              </a>
            </div>

            <div className="flex min-h-[300px] items-center justify-center border border-white/10 bg-white/[0.04]">
              <div className="px-6 text-center">
                <MapPin
                  size={42}
                  strokeWidth={1.2}
                  className="mx-auto text-[#D4AF37]"
                />
                <p className="mt-5 font-serif text-2xl text-white">
                  {property.locationDisplay}
                </p>
                {locationSubline ? (
                  <p className="mt-2 text-sm text-slate-400">{locationSubline}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SimilarProperties properties={similarProperties} />

      <section className="bg-[#F5F0E8] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Interested In This Property?
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
            Let&apos;s discuss
            <span className="block italic text-[#B8862F]">
              your requirements.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team can provide further information and arrange a viewing
            based on your requirements.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#14233A]"
            >
              <Phone size={17} />
              Speak With Us
            </a>

            <a
              href={enquiryWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-colors hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              <MessageCircle size={17} />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PropertyDetail;
