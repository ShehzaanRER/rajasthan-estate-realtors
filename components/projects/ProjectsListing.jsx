import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONTACT_PHONE_TEL, CONTACT_WHATSAPP_NUMBER } from "../../lib/siteConfig";
import {
  describeProjectFilters,
  projectsHref,
  PROJECT_STATUS_OPTIONS,
} from "../../lib/projects/filterParams";
import ProjectCard from "./ProjectCard";

const TYPE_TABS = [
  { key: null, label: "All" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
];

// min-h keeps the tap targets at a comfortable touch size; the extra height is
// padding above the label, so the underline still sits tight to the text.
function tabClasses(isActive) {
  return [
    "inline-flex min-h-[44px] items-end border-b-2 pb-2 text-sm font-semibold uppercase tracking-[0.14em] transition-colors duration-200",
    isActive
      ? "border-[#B8862F] text-[#081221]"
      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-[#081221]",
  ].join(" ");
}

function chipClasses(isActive) {
  return [
    "inline-flex min-h-[40px] items-center rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
    isActive
      ? "border-[#B8862F] bg-[#B8862F] text-white"
      : "border-slate-300 text-slate-600 hover:border-[#B8862F] hover:text-[#B8862F]",
  ].join(" ");
}

function emptyStateCopy(filters) {
  if (filters.projectType === "commercial") {
    return "No commercial projects are currently listed.";
  }

  if (filters.status) {
    const label = describeProjectFilters(filters).toLowerCase();
    return `There are no ${label} listed right now.`;
  }

  return "No projects match these filters.";
}

function ProjectsListing({ projects, filters }) {
  const count = projects.length;
  const summary = describeProjectFilters(filters);
  const hasFilter = Boolean(filters.projectType || filters.status);
  const intent = filters.projectType === "commercial" ? "commercial-property" : "new-project";

  const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to know more about new projects with Rajasthan Estate Realtors.",
  )}`;

  return (
    <main className="bg-white">
      <section className="bg-[#081221]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 md:px-16 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-6xl">
              New developments
              <span className="block italic text-[#D4AF37]">in the Western Suburbs.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-light leading-8 text-slate-300">
              Residential and commercial projects across Jogeshwari, Andheri,
              Goregaon, Malad and the surrounding areas.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="border-y border-slate-200">

            <div className="flex flex-wrap items-end gap-x-7 gap-y-3 pt-5">
              {TYPE_TABS.map((tab) => {
                const isActive = (filters.projectType ?? null) === tab.key;

                return (
                  <Link
                    key={tab.label}
                    href={projectsHref({ projectType: tab.key })}
                    aria-current={isActive ? "page" : undefined}
                    className={tabClasses(isActive)}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 py-5">
              <span className="mr-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Status
              </span>

              <Link
                href={projectsHref({ projectType: filters.projectType })}
                aria-current={!filters.status ? "page" : undefined}
                className={chipClasses(!filters.status)}
              >
                Any
              </Link>

              {PROJECT_STATUS_OPTIONS.map((option) => {
                const isActive = filters.status === option.value;

                return (
                  <Link
                    key={option.value}
                    href={projectsHref({
                      projectType: filters.projectType,
                      status: isActive ? null : option.value,
                    })}
                    aria-current={isActive ? "page" : undefined}
                    className={chipClasses(isActive)}
                  >
                    {option.label}
                  </Link>
                );
              })}

              <p className="ml-auto text-sm text-slate-500">
                {count} {count === 1 ? "project" : "projects"}
              </p>
            </div>

          </div>

          <div className="mt-6 mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
              {summary}
            </h2>

            {hasFilter ? (
              <Link
                href={projectsHref({})}
                className="inline-block py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#B8862F] underline-offset-4 hover:underline"
              >
                View all projects
              </Link>
            ) : null}
          </div>

          {count === 0 ? (
            <div className="border border-slate-200 bg-[#F7F5F1] px-8 py-14 text-center sm:px-12">
              <p className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
                {emptyStateCopy(filters)}
              </p>

              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                We hear about new developments before they are widely marketed.
                Tell us what you are looking for and we will keep you informed.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/contact?intent=${intent}`}
                  className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:bg-[#14233A]"
                >
                  Tell Us What You Need
                  <ArrowRight size={16} />
                </Link>

                {hasFilter ? (
                  <Link
                    href={projectsHref({})}
                    className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
                  >
                    View All Projects
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
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
            Looking at a project we haven&apos;t listed?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Tell us which development you are considering and we can help you
            weigh it up.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
            >
              Speak With Us
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

export default ProjectsListing;
