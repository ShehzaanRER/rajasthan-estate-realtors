import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

/** A badge wall reads as a portal listing, not a consultancy's selection. */
const MAX_HIGHLIGHT_TAGS = 2;

/**
 * Status describes what the development actually is, so it leads and is always
 * shown. Highlight tags are optional CMS-controlled positioning and are capped
 * at two. The project type only earns a chip when no tag already carries it.
 */
function highlightLabels(project) {
  const tags = project.highlightTags ?? [];
  const labels = tags.map((tag) => tag.label);
  const type = project.projectType;

  if (
    type &&
    type !== "residential" &&
    project.projectTypeLabel &&
    !tags.some((tag) => tag.value === type)
  ) {
    labels.unshift(project.projectTypeLabel);
  }

  return labels.slice(0, MAX_HIGHLIGHT_TAGS);
}

/**
 * A project card answers "what is this development, what does it offer, and
 * when is it ready" — a range and a timeline, not a single unit at a single
 * price. The configuration chips are the clearest signal that this object
 * contains many homes rather than being one of them.
 */
function ProjectCard({ project, priority = false }) {
  const image = project.featuredImage;
  const configurations = project.configurations ?? [];
  const possession =
    project.possessionDateDisplay || project.possessionStatusLabel || null;
  const highlights = highlightLabels(project);

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]">
      <div className="relative h-[260px] shrink-0 overflow-hidden bg-[#081221]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || project.name}
            fill
            sizes={CARD_IMAGE_SIZES}
            quality={70}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#081221]">
            <span className="h-px w-10 bg-[#B8862F]" />
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              Image coming soon
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/50 via-transparent to-transparent opacity-70" />

        <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex bg-[#081221] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
            {project.statusBadgeLabel}
          </span>

          {highlights.map((label) => (
            <span
              key={label}
              className="inline-flex border border-[#B8862F]/70 bg-[#081221]/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#D4AF37] backdrop-blur-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">

        {/* The name is the identity of a development, so it leads. */}
        <h3 className="font-serif text-2xl leading-snug text-[#081221]">
          {project.name}
        </h3>

        <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
          <MapPin size={16} className="mt-0.5 shrink-0 text-[#B8862F]" />
          <span>{project.location.locationDisplay}</span>
        </div>

        <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
          By {project.developer}
        </p>

        {configurations.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {configurations.map((configuration) => (
              <span
                key={configuration.name}
                className="inline-flex border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {configuration.name}
              </span>
            ))}
          </div>
        ) : null}

        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-200 pt-4">
          {project.startingPriceDisplay ? (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                Starting from
              </dt>
              <dd className="mt-1 text-base font-semibold text-[#081221]">
                {project.startingPriceDisplay}
              </dd>
            </div>
          ) : null}

          {possession ? (
            <div>
              <dt className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                Possession
              </dt>
              <dd className="mt-1 text-base font-medium text-slate-700">
                {possession}
              </dd>
            </div>
          ) : null}
        </dl>

        {/* mt-auto pins the action to the bottom of the card, so the buttons
            line up across a row whatever length the content above them runs to. */}
        <div className="mt-auto pt-6">
          <Link
            href={`/projects/${project.slug}`}
            className="group/link flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
          >
            <span>View Project</span>
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover/link:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
