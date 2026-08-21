const areas = [
  {
    name: "Jogeshwari West",
    description:
      "Our home market, with residential apartments, established societies and commercial spaces.",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Andheri West",
    description:
      "Luxury apartments, premium towers and excellent connectivity across one of Mumbai's most established suburbs.",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Lokhandwala",
    description:
      "High-end residences and premium lifestyle properties in one of Western Mumbai's sought-after neighbourhoods.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Goregaon",
    description:
      "A growing residential and commercial hub with modern developments and strong connectivity.",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Mira Road",
    description:
      "Spacious and accessible homes for families, first-time buyers and long-term investors.",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=85",
  },
];

function Areas() {
  return (
    <section className="bg-[#F7F5F1] py-24 lg:py-28">

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

          <div>

            {/* Eyebrow */}

            <div className="mb-6 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <span className="text-xs font-medium uppercase tracking-[0.4em] text-[#B8862F]">
                Our Local Expertise
              </span>

            </div>

            {/* Heading */}

            <h2 className="max-w-2xl font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl lg:text-6xl">
              Know the area.
              <span className="block italic text-[#B8862F]">
                Know the opportunity.
              </span>
            </h2>

          </div>


          {/* Description */}

          <div className="max-w-md lg:pb-1">

            <p className="text-base font-light leading-8 text-slate-600 sm:text-lg">
              Our roots are firmly established across Mumbai's Western
              Suburbs, giving our clients local insight that goes beyond
              simply finding a property.
            </p>

          </div>

        </div>


        {/* =========================================================
            AREA GRID
        ========================================================= */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">

          {areas.map((area, index) => (

            <article
              key={area.name}
              className={`group overflow-hidden border border-slate-200 bg-white ${
                index === 0
                  ? "lg:col-span-3"
                  : index === 1
                  ? "lg:col-span-3"
                  : "lg:col-span-2"
              }`}
            >

              {/* Image */}

              <div
                className={`relative overflow-hidden ${
                  index < 2 ? "h-[340px]" : "h-[280px]"
                }`}
              >

                <img
                  src={area.image}
                  alt={`${area.name} real estate`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Dark overlay */}

                <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/75 via-[#081221]/10 to-transparent" />

                {/* Area number */}

                <span className="absolute right-5 top-5 font-serif text-2xl font-light text-white/70">
                  0{index + 1}
                </span>

                {/* Area name */}

                <div className="absolute bottom-6 left-6">

                  <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                    Mumbai
                  </p>

                  <h3 className="font-serif text-3xl font-light text-white sm:text-4xl">
                    {area.name}
                  </h3>

                </div>

              </div>


              {/* Content */}

              <div className="p-6">

                <p className="text-sm font-light leading-7 text-slate-600">
                  {area.description}
                </p>


                <button
                  className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#081221] transition-colors duration-300 group-hover:text-[#B8862F]"
                >
                  Explore Area

                  <span className="text-lg leading-none transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </button>

              </div>

            </article>

          ))}

        </div>


        {/* =========================================================
            BOTTOM LINE
        ========================================================= */}

        <div className="mt-14 flex flex-col gap-4 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Western Suburbs · Mumbai
          </p>

          <p className="text-sm text-slate-500">
            Looking for a property in another area?
            <span className="ml-2 font-medium text-[#081221]">
              Speak with our property experts →
            </span>
          </p>

        </div>

      </div>

    </section>
  );
}

export default Areas;