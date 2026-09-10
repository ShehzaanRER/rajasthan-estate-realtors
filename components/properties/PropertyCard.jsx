import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

function PropertyCard({ property, priority = false }) {
  const image = property.images?.[0];
  const typeLabel = property.propertyTypeLabel || property.categoryLabel;
  const displayPrice = property.pricing?.displayPrice;
  const hasBedrooms = typeof property.bedrooms === "number" && property.bedrooms > 0;
  const hasBathrooms = typeof property.bathrooms === "number" && property.bathrooms > 0;

  return (
    <article className="group overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]">
      <div className="relative h-[300px] overflow-hidden bg-[#081221]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || property.title}
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

        {property.badge ? (
          <div className="absolute left-5 top-5">
            <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              {property.badge}
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-6">
        {typeLabel ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B8862F]">
            {typeLabel}
          </p>
        ) : null}

        <h3 className="mt-3 font-serif text-2xl font-medium text-[#081221]">
          {property.title}
        </h3>

        {property.locationDisplay ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <MapPin size={16} className="shrink-0 text-[#B8862F]" />
            {property.locationDisplay}
          </div>
        ) : null}

        {(property.areaDisplay || hasBedrooms || hasBathrooms) ? (
          <div className="mt-5 flex gap-6 border-y border-slate-200 py-4">
            {property.areaDisplay ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  Area
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {property.areaDisplay}
                </p>
              </div>
            ) : null}

            {hasBedrooms ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  Beds
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {property.bedrooms}
                </p>
              </div>
            ) : null}

            {hasBathrooms ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                  Baths
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {property.bathrooms}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {displayPrice ? (
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                Price
              </p>
              <p className="mt-1 text-xl font-semibold text-[#081221]">
                {displayPrice}
              </p>
            </div>
          </div>
        ) : null}

        <Link
          href={`/properties/${property.slug}`}
          className="group/link mt-6 flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
        >
          <span>View Property</span>
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover/link:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}

export default PropertyCard;
