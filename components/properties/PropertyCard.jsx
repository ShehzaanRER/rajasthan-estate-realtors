import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

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

/**
 * A property card answers "what is this exact unit, and what does it cost".
 * Price and location lead; the title supports them rather than repeating them.
 */
function PropertyCard({ property, priority = false }) {
  const image = property.images?.[0];
  const displayPrice = property.pricing?.displayPrice;
  const tag = highlightTag(property.tags);

  // Purpose is always shown. It previously lost the badge slot to tags like
  // "Premium", which hid whether the property was for sale or for rent.
  const purposeLabel =
    property.purpose === "rent"
      ? "For Rent"
      : property.purpose === "lease"
        ? "For Lease"
        : "For Sale";

  const specs = [];

  if (typeof property.bedrooms === "number" && property.bedrooms > 0) {
    specs.push(`${property.bedrooms} BHK`);
  }

  if (property.areaDisplay) {
    specs.push(property.areaDisplay);
  }

  if (property.category === "commercial") {
    if (property.propertyTypeLabel) {
      specs.push(property.propertyTypeLabel);
    }
  } else if (property.details?.furnishing) {
    const furnishing = {
      unfurnished: "Unfurnished",
      "semi-furnished": "Semi-furnished",
      furnished: "Furnished",
    }[property.details.furnishing];

    if (furnishing) {
      specs.push(furnishing);
    }
  }

  return (
    <article className="group @container flex h-full flex-col overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]">
      <div className="relative h-[150px] shrink-0 overflow-hidden bg-[#081221] @2xs:h-[260px]">
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
            <p className="px-2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-[#D4AF37] @2xs:text-[11px] @2xs:tracking-[0.25em]">
              Image coming soon
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/50 via-transparent to-transparent opacity-70" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5 @2xs:left-5 @2xs:top-5 @2xs:gap-2">
          <span className="inline-flex bg-[#081221] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white @2xs:px-3.5 @2xs:py-1.5 @2xs:text-[11px] @2xs:tracking-[0.16em]">
            {purposeLabel}
          </span>

          {tag ? (
            <span className="inline-flex bg-[#B8862F] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white @2xs:px-3 @2xs:py-1.5 @2xs:text-[11px] @2xs:tracking-[0.16em]">
              {tag}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5 @2xs:p-6">

        {/* Price leads — it is the single most decision-relevant fact. */}
        <p className="text-lg font-semibold leading-none text-[#081221] @2xs:text-2xl">
          {displayPrice}
        </p>

        {/* Clamped so one long locality cannot make a card taller than the one
            beside it in the two-up grid. */}
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600 @2xs:mt-3 @2xs:gap-2 @2xs:text-sm">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8862F] @2xs:h-4 @2xs:w-4"
          />
          <span className="line-clamp-2">{property.locationDisplay}</span>
        </div>

        {specs.length > 0 ? (
          <p className="mt-2 text-[11px] font-medium text-slate-700 @2xs:mt-3 @2xs:text-sm">
            {specs.join(" · ")}
          </p>
        ) : null}

        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500 @2xs:mt-3 @2xs:text-sm @2xs:leading-6">
          {property.title}
        </p>

        {/* mt-auto pins the action to the bottom of the card, so the buttons
            line up across a row whatever length the content above them runs to. */}
        <div className="mt-auto pt-4 @2xs:pt-6">
          <Link
            href={`/properties/${property.slug}`}
            className="group/link flex min-h-11 w-full items-center justify-between gap-1 border border-slate-300 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white @2xs:px-5 @2xs:py-3 @2xs:text-sm @2xs:tracking-[0.12em]"
          >
            <span>View Property</span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/link:translate-x-1 @2xs:h-[18px] @2xs:w-[18px]"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
