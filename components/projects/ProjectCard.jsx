import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

function configurationSummary(configurations) {
  if (!configurations?.length) {
    return null;
  }

  return configurations.map((configuration) => configuration.name).join(", ");
}

function ProjectCard({ project, priority = false }) {
  const image = project.featuredImage;
  const configSummary = configurationSummary(project.configurations);

  return (
    <article className="group overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]">
      <div className="relative h-[300px] overflow-hidden bg-[#081221]">
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

        <div className="absolute left-5 top-5">
          <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
            {project.statusLabel}
          </span>
        </div>
      </div>

      <div className="p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B8862F]">
          {project.developer}
        </p>

        <h3 className="mt-3 font-serif text-2xl font-medium text-[#081221]">
          {project.name}
        </h3>

        {project.location.locationDisplay ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} className="shrink-0 text-[#B8862F]" />
            {project.location.locationDisplay}
          </div>
        ) : null}

        {(configSummary || project.possessionStatusLabel) ? (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-y border-slate-200 py-4">
            {configSummary ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  Configurations
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {configSummary}
                </p>
              </div>
            ) : null}

            {project.possessionStatusLabel ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  Possession
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {project.possessionStatusLabel}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {project.startingPriceDisplay ? (
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                Starting From
              </p>
              <p className="mt-1 text-xl font-semibold text-[#081221]">
                {project.startingPriceDisplay}
              </p>
            </div>
          </div>
        ) : null}

        <Link
          href={`/projects/${project.slug}`}
          className="group/link mt-6 flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
        >
          <span>View Project</span>
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover/link:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

export default ProjectCard;
