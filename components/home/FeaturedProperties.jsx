import Image from "next/image";
import Link from "next/link";

const FEATURED_IMAGE_SIZES = "(min-width: 768px) 33vw, 100vw";

function FeaturedProperties({ properties = [] }) {
  const count = properties.length;

  return (
    <section id="properties" className="bg-white py-24">

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* =========================================================
            SECTION HEADER
        ========================================================= */}

        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div>

            {/* Eyebrow */}
            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-10 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                Featured Opportunities
              </p>

            </div>

            {/* Heading */}
            <h2 className="font-serif text-4xl font-medium tracking-tight text-[#081221] sm:text-5xl">
              Properties Worth
              <span className="block italic text-[#B8862F]">
                Exploring.
              </span>
            </h2>

            {/* Description */}
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              A selection of residential and commercial opportunities
              carefully chosen across Mumbai's Western Suburbs.
            </p>

          </div>


          {/* View All */}
          <Link
            href="/properties"
            className="group inline-flex w-fit items-center gap-3 border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            View All Properties

            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>


        {/* =========================================================
            PROPERTY GRID
        ========================================================= */}

        {count === 0 ? (
          <div className="border border-slate-200 bg-[#F7F5F1] px-8 py-16 text-center sm:px-12">
            <p className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
              Featured opportunities will appear here shortly.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Please check back soon, or browse the full collection of
              properties currently available through Rajasthan Estate Realtors.
            </p>
            <Link
              href="/properties"
              className="group mt-8 inline-flex items-center gap-3 border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              Browse all properties
              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">

            {properties.map((property, index) => {
              const image = property.images?.[0];
              const typeLabel = property.categoryLabel || property.propertyTypeLabel;
              const displayPrice = property.pricing?.displayPrice;
              const isPriority = index === 0;

              return (
                <article
                  key={property.slug}
                  className="group overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]"
                >

                  {/* =====================================================
                      IMAGE
                  ===================================================== */}

                  <div className="relative h-[320px] overflow-hidden bg-[#081221]">

                    {image?.url ? (
                      <Image
                        src={image.url}
                        alt={image.alt || property.title}
                        fill
                        sizes={FEATURED_IMAGE_SIZES}
                        quality={70}
                        priority={isPriority}
                        loading={isPriority ? undefined : "lazy"}
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

                    {/* Image overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/50 via-transparent to-transparent opacity-70" />

                    {/* Badge */}
                    {property.badge ? (
                      <div className="absolute left-5 top-5">

                        <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                          {property.badge}
                        </span>

                      </div>
                    ) : null}

                  </div>


                  {/* =====================================================
                      PROPERTY DETAILS
                  ===================================================== */}

                  <div className="p-6">

                    {/* Property type */}
                    {typeLabel ? (
                      <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B8862F]">
                        {typeLabel}
                      </p>
                    ) : null}


                    {/* Title */}
                    <h3 className="mt-3 font-serif text-2xl font-medium text-[#081221]">
                      {property.title}
                    </h3>


                    {/* Location */}
                    {property.locationDisplay ? (
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4 shrink-0 text-[#B8862F]"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
                          />

                          <circle
                            cx="12"
                            cy="10"
                            r="2.3"
                          />
                        </svg>

                        {property.locationDisplay}

                      </div>
                    ) : null}


                    {/* Divider */}
                    <div className="my-5 h-px bg-slate-200" />


                    {/* Area + Price */}
                    <div className="flex items-end justify-between">

                      {property.areaDisplay ? (
                        <div>

                          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            Area
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {property.areaDisplay}
                          </p>

                        </div>
                      ) : (
                        <div />
                      )}


                      {displayPrice ? (
                        <div className="text-right">

                          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                            Price
                          </p>

                          <p className="mt-1 text-xl font-semibold text-[#081221]">
                            {displayPrice}
                          </p>

                        </div>
                      ) : null}

                    </div>


                    {/* View Property */}
                    <Link
                      href={`/properties/${property.slug}`}
                      className="group/link mt-6 flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
                    >

                      <span>
                        View Property
                      </span>

                      <span className="text-lg transition-transform duration-300 group-hover/link:translate-x-1">
                        →
                      </span>

                    </Link>

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>

    </section>
  );
}

export default FeaturedProperties;
