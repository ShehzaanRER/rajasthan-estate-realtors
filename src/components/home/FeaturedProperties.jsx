const properties = [
  {
    id: 1,
    title: "3 BHK Luxury Apartment",
    location: "Lokhandwala, Andheri West",
    price: "₹3.25 Cr",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    status: "For Sale",
    type: "Residential",
    area: "1,250 sq. ft.",
  },
  {
    id: 2,
    title: "Luxury Independent Villa",
    location: "Mira Road, Mumbai",
    price: "₹5.80 Cr",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=85",
    status: "Premium",
    type: "Residential",
    area: "3,200 sq. ft.",
  },
  {
    id: 3,
    title: "2 BHK Premium Residence",
    location: "Jogeshwari West",
    price: "₹1.65 Cr",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85",
    status: "New",
    type: "Residential",
    area: "950 sq. ft.",
  },
];

function FeaturedProperties() {
  return (
    <section className="bg-white py-24">

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
          <a
            href="#properties"
            className="group inline-flex w-fit items-center gap-3 border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            View All Properties

            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>

        </div>


        {/* =========================================================
            PROPERTY GRID
        ========================================================= */}

        <div className="grid gap-8 md:grid-cols-3">

          {properties.map((property) => (

            <article
              key={property.id}
              className="group overflow-hidden border border-slate-200 bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(8,18,33,0.12)]"
            >

              {/* =====================================================
                  IMAGE
              ===================================================== */}

              <div className="relative h-[320px] overflow-hidden">

                <img
                  src={property.image}
                  alt={property.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Image overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/50 via-transparent to-transparent opacity-70" />

                {/* Status */}
                <div className="absolute left-5 top-5">

                  <span className="inline-flex bg-[#B8862F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    {property.status}
                  </span>

                </div>

              </div>


              {/* =====================================================
                  PROPERTY DETAILS
              ===================================================== */}

              <div className="p-6">

                {/* Property type */}
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#B8862F]">
                  {property.type}
                </p>


                {/* Title */}
                <h3 className="mt-3 font-serif text-2xl font-medium text-[#081221]">
                  {property.title}
                </h3>


                {/* Location */}
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 text-[#B8862F]"
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

                  {property.location}

                </div>


                {/* Divider */}
                <div className="my-5 h-px bg-slate-200" />


                {/* Area + Price */}
                <div className="flex items-end justify-between">

                  <div>

                    <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                      Area
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {property.area}
                    </p>

                  </div>


                  <div className="text-right">

                    <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                      Price
                    </p>

                    <p className="mt-1 text-xl font-semibold text-[#081221]">
                      {property.price}
                    </p>

                  </div>

                </div>


                {/* View Property */}
                <button
                  className="group/link mt-6 flex w-full items-center justify-between border border-slate-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:bg-[#B8862F] hover:text-white"
                >

                  <span>
                    View Property
                  </span>

                  <span className="text-lg transition-transform duration-300 group-hover/link:translate-x-1">
                    →
                  </span>

                </button>

              </div>

            </article>

          ))}

        </div>

      </div>

    </section>
  );
}

export default FeaturedProperties;