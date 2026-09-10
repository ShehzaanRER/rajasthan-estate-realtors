import { CONTACT_PHONE_TEL, CONTACT_WHATSAPP_NUMBER } from "../../lib/siteConfig";
import ProjectCard from "./ProjectCard";

function ProjectsListing({ projects }) {
  const count = projects.length;
  const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hi, I'd like to know more about new projects with Rajasthan Estate Realtors.",
  )}`;

  return (
    <main className="bg-white">
      <section className="bg-[#081221]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-16 md:px-16 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-12 bg-[#B8862F]" />
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                New Developments
              </p>
            </div>

            <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
              Discover new
              <span className="block italic text-[#D4AF37]">
                projects in Mumbai.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base font-light leading-8 text-slate-300 sm:text-lg">
              Explore upcoming and ongoing residential and commercial
              developments across Mumbai's Western Suburbs, curated by our
              local property experts.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Featured Developments
                </p>
              </div>

              <h2 className="font-serif text-4xl font-medium tracking-tight text-[#081221] sm:text-5xl">
                Explore New
                <span className="block italic text-[#B8862F]">
                  Projects.
                </span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-slate-500 md:text-right">
              Showing{" "}
              <span className="font-semibold text-[#081221]">{count}</span>{" "}
              {count === 1 ? "project" : "projects"} currently listed through
              Rajasthan Estate Realtors.
            </p>
          </div>

          {count === 0 ? (
            <div className="border border-slate-200 bg-[#F7F5F1] px-8 py-16 text-center sm:px-12">
              <p className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
                No projects are currently listed.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                Please check back soon or contact us to discuss new project
                opportunities.
              </p>
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

      <section className="bg-[#F5F0E8] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Looking For Something Specific?
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
            Tell us what you are
            <span className="block italic text-[#B8862F]">
              looking for.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team can help you find new project opportunities that match
            your requirements, even if they are not currently listed online.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
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
