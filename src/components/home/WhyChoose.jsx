import {
  BadgeCheck,
  MapPin,
  Users,
  Building2,
  ArrowUpRight,
} from "lucide-react";

function WhyChoose() {
  const items = [
    {
      icon: <BadgeCheck size={28} strokeWidth={1.5} />,
      number: "35+",
      title: "Years of Experience",
      text: "Established in 1988, with decades of experience helping clients make confident real estate decisions.",
    },
    {
      icon: <MapPin size={28} strokeWidth={1.5} />,
      number: "01",
      title: "Local Expertise",
      text: "Deep knowledge of Mumbai's Western Suburbs, from Jogeshwari and Andheri to Goregaon and beyond.",
    },
    {
      icon: <Users size={28} strokeWidth={1.5} />,
      number: "01",
      title: "Personal Guidance",
      text: "A relationship-driven approach with personal attention from property search through completion.",
    },
    {
      icon: <Building2 size={28} strokeWidth={1.5} />,
      number: "360°",
      title: "Complete Real Estate Support",
      text: "Residential and commercial property expertise across buying, selling, renting and investment.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#081221] py-24 lg:py-28">

      {/* Subtle background glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[#B8862F]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">

        {/* =========================================================
            SECTION INTRO
        ========================================================= */}

        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">

          <div>

            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <span className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37]">
                Why Rajasthan Estate Realtors
              </span>

            </div>

            {/* Heading */}
            <h2 className="max-w-xl font-serif text-4xl font-light leading-tight text-white sm:text-5xl lg:text-6xl">
              Experience that
              <span className="block italic text-[#D4AF37]">
                makes a difference.
              </span>
            </h2>

          </div>


          {/* Description */}

          <div className="max-w-xl lg:ml-auto">

            <p className="text-base font-light leading-8 text-slate-300 sm:text-lg">
              For more than three decades, Rajasthan Estate Realtors has
              built its reputation on local knowledge, personal relationships
              and a straightforward approach to real estate.
            </p>

            <p className="mt-5 text-base font-light leading-8 text-slate-400">
              Whether you are buying your first home, selling a property,
              looking for commercial space or evaluating an investment,
              we are here to guide you through every step.
            </p>

          </div>

        </div>


        {/* =========================================================
            TRUST POINTS
        ========================================================= */}

        <div className="mt-16 grid border-t border-white/10 md:grid-cols-2 lg:grid-cols-4">

          {items.map((item, index) => (

            <div
              key={index}
              className="group relative border-b border-white/10 p-8 transition-all duration-300 hover:bg-white/[0.03] md:border-r lg:border-b-0 last:border-r-0"
            >

              {/* Top icon + number */}

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#B8862F]/40 text-[#D4AF37] transition-all duration-300 group-hover:border-[#D4AF37] group-hover:bg-[#B8862F]/10">
                  {item.icon}
                </div>

                <span className="font-serif text-3xl font-light text-white/20">
                  {item.number}
                </span>

              </div>


              {/* Content */}

              <h3 className="mt-8 text-xl font-medium text-white">
                {item.title}
              </h3>

              <p className="mt-4 text-sm font-light leading-7 text-slate-400">
                {item.text}
              </p>


              {/* Hover arrow */}

              <div className="mt-7 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#D4AF37] opacity-0 transition-all duration-300 group-hover:opacity-100">

                <span>Learn More</span>

                <ArrowUpRight
                  size={14}
                  strokeWidth={1.5}
                />

              </div>

            </div>

          ))}

        </div>


        {/* =========================================================
            BOTTOM STATEMENT
        ========================================================= */}

        <div className="mt-16 flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">
            Established 1988 · Mumbai
          </p>

          <p className="max-w-md text-sm leading-6 text-slate-400 sm:text-right">
            Trusted guidance built on experience, relationships and a deep
            understanding of Mumbai real estate.
          </p>

        </div>

      </div>

    </section>
  );
}

export default WhyChoose;