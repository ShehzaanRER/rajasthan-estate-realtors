import { ArrowRight, MapPin, SlidersHorizontal } from "lucide-react";
import properties from "../../data/properties";

function Properties() {
  return (
    <main className="bg-white">

      {/* =========================================================
          PAGE HERO
      ========================================================= */}
      <section className="bg-[#081221]">

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-16 md:px-16 lg:px-8">

          <div className="max-w-4xl">

            <div className="mb-6 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                RER Property Collection
              </p>

            </div>

            <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">

              Find a property

              <span className="block italic text-[#D4AF37]">
                worth calling home.
              </span>

            </h1>

            <p className="mt-7 max-w-2xl text-base font-light leading-8 text-slate-300 sm:text-lg">
              Explore residential and commercial property opportunities
              across Mumbai's Western Suburbs, carefully selected by our
              local property experts.
            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          SEARCH / FILTER AREA
      ========================================================= */}
      <section className="bg-[#F7F5F1] py-10 sm:py-12">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_15px_45px_rgba(8,18,33,0.06)] sm:p-8">

            <div className="mb-6 flex items-center gap-3">

              <SlidersHorizontal
                size={19}
                className="text-[#B8862F]"
              />

              <h2 className="font-serif text-2xl text-[#081221]">
                Refine Your Search
              </h2>

            </div>


            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* Looking For */}

              <div className="flex flex-col">

                <label className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Looking For
                </label>

                <select className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F]">

                  <option>Buy</option>
                  <option>Rent</option>
                  <option>Commercial</option>

                </select>

              </div>


              {/* Property Type */}

              <div className="flex flex-col">

                <label className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Property Type
                </label>

                <select className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F]">

                  <option>All Types</option>
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>Independent House</option>
                  <option>Commercial</option>

                </select>

              </div>


              {/* Location */}

              <div className="flex flex-col">

                <label className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Location
                </label>

                <select className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F]">

                  <option>All Locations</option>
                  <option>Jogeshwari West</option>
                  <option>Andheri West</option>
                  <option>Lokhandwala</option>
                  <option>Goregaon</option>
                  <option>Mira Road</option>

                </select>

              </div>


              {/* Budget */}

              <div className="flex flex-col">

                <label className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Budget
                </label>

                <select className="h-14 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F]">

                  <option>Any Budget</option>
                  <option>Under ₹1 Cr</option>
                  <option>₹1 Cr – ₹2 Cr</option>
                  <option>₹2 Cr – ₹5 Cr</option>
                  <option>₹5 Cr+</option>

                </select>

              </div>

            </div>


            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">

              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-[#081221]">
                  {properties.length}
                </span>{" "}
                featured opportunities
              </p>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_12px_30px_rgba(184,134,47,0.25)]"
              >
                Search Properties

                <ArrowRight size={17} />
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          PROPERTY RESULTS
      ========================================================= */}
      <section className="bg-white py-16 sm:py-20">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          {/* Section heading */}

          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div>

              <div className="mb-5 flex items-center gap-3">

                <span className="h-px w-10 bg-[#B8862F]" />

                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Available Properties
                </p>

              </div>

              <h2 className="font-serif text-4xl font-medium tracking-tight text-[#081221] sm:text-5xl">
                Explore Our
                <span className="block italic text-[#B8862F]">
                  Properties.
                </span>
              </h2>

            </div>

            <p className="max-w-md text-sm leading-7 text-slate-500 md:text-right">
              Browse a selection of residential and commercial opportunities
              currently available through Rajasthan Estate Realtors.
            </p>

          </div>


          {/* Property grid */}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {properties.map((property) => (

              <article
                key={property.id}
                className="group overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]"
              >

                {/* Image */}

                <div className="relative h-[300px] overflow-hidden">

                  <img
                    src={property.image}
                    alt={`${property.title} in ${property.location}`}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/50 via-transparent to-transparent opacity-70" />

                  <div className="absolute left-5 top-5">

                    <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {property.status}
                    </span>

                  </div>

                </div>


                {/* Details */}

                <div className="p-6">

                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B8862F]">
                    {property.type}
                  </p>

                  <h3 className="mt-3 font-serif text-2xl font-medium text-[#081221]">
                    {property.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                    <MapPin
                      size={16}
                      className="shrink-0 text-[#B8862F]"
                    />

                    {property.location}

                  </div>


                  {/* Property specs */}

                  <div className="mt-5 flex gap-6 border-y border-slate-200 py-4">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                        Area
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {property.area}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                        Beds
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {property.bedrooms}
                      </p>

                    </div>

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                        Baths
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {property.bathrooms}
                      </p>

                    </div>

                  </div>


                  {/* Price */}

                  <div className="mt-5 flex items-end justify-between">

                    <div>

                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">
                        Price
                      </p>

                      <p className="mt-1 text-xl font-semibold text-[#081221]">
                        {property.price}
                      </p>

                    </div>

                  </div>


                  {/* View property */}

                  <a
                    href={`/properties/${property.slug}`}
                    className="group/link mt-6 flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
                  >

                    <span>
                      View Property
                    </span>

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover/link:translate-x-1"
                    />

                  </a>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          ENQUIRY CTA
      ========================================================= */}
      <section className="bg-[#F5F0E8] py-16 sm:py-20">

        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Can't Find What You're Looking For?
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
            Tell us what you are
            <span className="block italic text-[#B8862F]">
              looking for.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our property experts can help you find opportunities that match
            your requirements, even if they are not currently listed online.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">

            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
            >
              Speak With Us

              <ArrowRight size={18} />
            </a>

            <a
              href="https://wa.me/919892371329"
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

export default Properties;