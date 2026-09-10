import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import PropertyGallery from "../properties/PropertyGallery";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_NUMBER,
} from "../../lib/siteConfig";

const FLOOR_PLAN_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

function whatsappHref(project) {
  const text = `Hi, I'm interested in ${project.name} (${project.projectId}) in ${project.location.locationDisplay}. Listing: /projects/${project.slug}`;
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function mapsHref(mapsQuery) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
}

function ProjectDetail({ project }) {
  const specCells = [];

  if (project.configurations.length > 0) {
    specCells.push({
      key: "configurations",
      icon: <Layers size={19} className="text-[#B8862F]" />,
      label: "Configurations",
      value: project.configurations.map((c) => c.name).join(", "),
    });
  }

  if (project.numberOfTowers) {
    specCells.push({
      key: "towers",
      icon: <Building2 size={19} className="text-[#B8862F]" />,
      label: "Towers",
      value: String(project.numberOfTowers),
    });
  }

  if (project.possessionStatusLabel) {
    specCells.push({
      key: "possession",
      icon: null,
      label: "Possession",
      value: project.possessionDateDisplay
        ? `${project.possessionStatusLabel} (${project.possessionDateDisplay})`
        : project.possessionStatusLabel,
    });
  }

  specCells.push({
    key: "status",
    icon: null,
    label: "Status",
    value: project.statusLabel,
  });

  const specColumns =
    specCells.length >= 4
      ? "sm:grid-cols-4"
      : specCells.length === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2";

  const enquiryWhatsapp = whatsappHref(project);
  const locationMapsHref = mapsHref(project.location.mapsQuery);
  const hasOverviewCopy = Boolean(project.descriptionHtml || project.descriptionText);
  const locationSubline = [project.location.city, project.location.state]
    .filter(Boolean)
    .join(", ");

  const detailsRows = [];
  const pushRow = (label, value) => {
    if (value) {
      detailsRows.push({ label, value });
    }
  };

  pushRow("Developer", project.developer);
  pushRow("RER Project Number", project.projectId);
  pushRow("RERA Registration Number", project.reraNumber);
  pushRow("Project Type", project.projectTypeLabel);
  pushRow("Property Type", project.propertyTypeLabel);
  pushRow("Construction Status", project.constructionStatus);
  pushRow("Number of Towers", project.numberOfTowers ? String(project.numberOfTowers) : null);
  pushRow("Number of Floors", project.numberOfFloors ? String(project.numberOfFloors) : null);
  pushRow("Total Units", project.totalUnits ? String(project.totalUnits) : null);
  pushRow("Parking", project.parkingInfo);
  pushRow("Location", project.location.locationDisplay);

  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-[#F7F5F1]">
        <div className="mx-auto max-w-7xl px-6 py-5 sm:px-10 md:px-16 lg:px-8">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#B8862F]"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to Projects
          </Link>
        </div>
      </section>

      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <PropertyGallery images={project.images} title={project.name} />
        </div>
      </section>

      <section className="bg-white pb-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#B8862F]">
                {project.developer}
              </p>

              <div className="mt-4">
                <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  {project.statusLabel}
                </span>
              </div>

              <h1 className="mt-4 font-serif text-4xl font-medium leading-tight text-[#081221] sm:text-5xl md:text-6xl">
                {project.name}
              </h1>

              {project.location.locationDisplay ? (
                <div className="mt-5 flex items-center gap-2 text-base text-slate-500">
                  <MapPin size={18} className="shrink-0 text-[#B8862F]" />
                  {project.location.locationDisplay}
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
                        <p className={`${cell.icon ? "mt-1" : "mt-4"} text-sm font-medium text-[#081221] break-words`}>
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
                Starting From
              </p>
              <p className="mt-2 font-serif text-4xl text-[#081221]">
                {project.startingPriceDisplay ?? "Price on request"}
              </p>

              <div className="my-6 h-px bg-slate-200" />

              <p className="text-sm leading-6 text-slate-600">
                Interested in this project? Speak directly with our property
                experts for availability, configurations and a site visit.
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

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
              >
                <Mail size={17} />
                Email Us
              </a>
            </aside>
          </div>
        </div>
      </section>

      {hasOverviewCopy || project.highlights.length > 0 || detailsRows.length > 0 ? (
        <section className="bg-[#F7F5F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
              <div className="min-w-0">
                <div className="mb-6 flex items-center gap-4">
                  <span className="h-px w-10 bg-[#B8862F]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
                    Project Overview
                  </p>
                </div>

                <h2 className="font-serif text-4xl font-light text-[#081221] sm:text-5xl">
                  A closer look at
                  <span className="block italic text-[#B8862F]">
                    this project.
                  </span>
                </h2>

                {project.descriptionHtml ? (
                  <div
                    className="property-description mt-7 max-w-2xl"
                    dangerouslySetInnerHTML={{ __html: project.descriptionHtml }}
                  />
                ) : project.descriptionText ? (
                  <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    {project.descriptionText}
                  </p>
                ) : null}

                {project.highlights.length > 0 ? (
                  <ul className="mt-7 max-w-2xl space-y-3">
                    {project.highlights.map((highlight, index) => (
                      <li
                        key={`${highlight}-${index}`}
                        className="flex items-start gap-3 text-base leading-7 text-slate-600"
                      >
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8862F]" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {detailsRows.length > 0 ? (
                <div className="min-w-0">
                  <h3 className="font-serif text-3xl text-[#081221]">
                    Project Details
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
                        <span className="text-sm font-medium text-[#081221] sm:text-right sm:break-words">
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

      {project.configurations.length > 0 ? (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Pricing
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Configurations &amp; Pricing
              </h2>
            </div>

            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#081221] text-white">
                    <th className="px-5 py-4 font-medium uppercase tracking-[0.1em]">Configuration</th>
                    <th className="px-5 py-4 font-medium uppercase tracking-[0.1em]">Area</th>
                    <th className="px-5 py-4 font-medium uppercase tracking-[0.1em]">Price</th>
                    <th className="px-5 py-4 font-medium uppercase tracking-[0.1em]">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {project.configurations.map((configuration, index) => (
                    <tr key={`${configuration.name}-${index}`} className="bg-white">
                      <td className="px-5 py-4 font-medium text-[#081221]">
                        {configuration.name}
                        {configuration.notes ? (
                          <span className="mt-1 block text-xs font-normal text-slate-500">
                            {configuration.notes}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {configuration.carpetAreaDisplay ?? configuration.areaRangeDisplay ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {configuration.priceLabel ??
                          (configuration.startingPriceDisplay
                            ? configuration.maxPriceDisplay
                              ? `${configuration.startingPriceDisplay} - ${configuration.maxPriceDisplay}`
                              : `From ${configuration.startingPriceDisplay}`
                            : "Price on request")}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {configuration.availability
                          ? configuration.availability.charAt(0).toUpperCase() +
                            configuration.availability.slice(1).replace("-", " ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {project.amenityNames.length > 0 ? (
        <section className="bg-[#F7F5F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Features
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Project Amenities
              </h2>
            </div>

            <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {project.amenityNames.map((amenity, index) => (
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

      {project.specifications.length > 0 ? (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Details
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Specifications
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {project.specifications.map((spec, index) => (
                <div
                  key={`${spec.label}-${index}`}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <span className="text-sm text-slate-500">{spec.label}</span>
                  <span className="text-sm font-medium text-[#081221] sm:text-right">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {project.floorPlans.length > 0 ? (
        <section className="bg-[#F7F5F1] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
            <div className="mb-10">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Layouts
                </p>
              </div>
              <h2 className="font-serif text-4xl text-[#081221] sm:text-5xl">
                Floor Plans
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {project.floorPlans.map((plan, index) => (
                <div key={`${plan.url}-${index}`} className="border border-slate-200 bg-white">
                  <div className="relative h-[280px] w-full overflow-hidden bg-white">
                    <Image
                      src={plan.url}
                      alt={plan.alt || `${project.name} floor plan ${index + 1}`}
                      fill
                      sizes={FLOOR_PLAN_SIZES}
                      quality={85}
                      loading="lazy"
                      className="object-contain"
                    />
                  </div>
                  {plan.caption ? (
                    <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                      {plan.caption}
                    </p>
                  ) : null}
                </div>
              ))}
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
                  {project.location.locationDisplay}.
                </span>
              </h2>

              {project.location.address ? (
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  {project.location.address}
                </p>
              ) : (
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  Speak with our team to learn more about the neighbourhood,
                  connectivity, nearby amenities and other factors that may be
                  important to your decision.
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
              {project.locationMapImage?.url ? (
                <div className="relative h-full min-h-[300px] w-full">
                  <Image
                    src={project.locationMapImage.url}
                    alt={project.locationMapImage.alt || `${project.name} location map`}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    quality={80}
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="px-6 text-center">
                  <MapPin
                    size={42}
                    strokeWidth={1.2}
                    className="mx-auto text-[#D4AF37]"
                  />
                  <p className="mt-5 font-serif text-2xl text-white">
                    {project.location.locationDisplay}
                  </p>
                  {locationSubline ? (
                    <p className="mt-2 text-sm text-slate-400">{locationSubline}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F0E8] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Interested In This Project?
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
            Let&apos;s discuss
            <span className="block italic text-[#B8862F]">
              your requirements.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team can provide further information, current availability
            and arrange a site visit based on your requirements.
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

export default ProjectDetail;
