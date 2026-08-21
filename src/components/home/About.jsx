import { ArrowRight, Check } from "lucide-react";

function About() {
  const highlights = [
    "Established in Mumbai since 1988",
    "Deep expertise across the Western Suburbs",
    "Residential and commercial property specialists",
    "Personal guidance throughout the transaction",
  ];

  return (
    <section
      id="about"
      className="bg-white py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}

        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">

          {/* =======================================================
              IMAGE SIDE
          ======================================================= */}

          <div className="relative">

            {/* Decorative frame */}

            <div className="absolute -left-4 -top-4 h-full w-full border border-[#B8862F]/40" />

            <div className="relative overflow-hidden">

              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=85"
                alt="Mumbai residential property"
                className="h-[520px] w-full object-cover sm:h-[600px]"
              />

              {/* Image overlay */}

              <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/70 via-transparent to-transparent" />

              {/* Since 1988 badge */}

              <div className="absolute bottom-7 left-7 border border-white/30 bg-[#081221]/85 px-7 py-6 backdrop-blur-sm">

                <p className="font-serif text-5xl font-light text-[#D4AF37]">
                  1988
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white">
                  Established
                </p>

              </div>

            </div>

          </div>


          {/* =======================================================
              TEXT SIDE
          ======================================================= */}

          <div>

            {/* Eyebrow */}

            <div className="mb-6 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <span className="text-xs font-medium uppercase tracking-[0.4em] text-[#B8862F]">
                About Rajasthan Estate Realtors
              </span>

            </div>


            {/* Heading */}

            <h2 className="max-w-xl font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl lg:text-6xl">

              Built on trust.
              
              <span className="block italic text-[#B8862F]">
                Rooted in Mumbai.
              </span>

            </h2>


            {/* Intro */}

            <p className="mt-8 text-lg font-medium leading-8 text-slate-700">
              For more than three decades, Rajasthan Estate Realtors has
              helped individuals, families and businesses navigate Mumbai's
              real estate market.
            </p>


            {/* Body */}

            <p className="mt-5 text-base font-light leading-8 text-slate-600">
              What began in 1988 has grown through relationships, referrals
              and a deep understanding of the communities we serve. Our
              approach remains simple — understand what our clients need,
              provide honest advice and help them make informed property
              decisions.
            </p>

            <p className="mt-5 text-base font-light leading-8 text-slate-600">
              From finding a family home to evaluating a commercial
              opportunity, we combine local market knowledge with personal
              attention at every stage of the journey.
            </p>


            {/* =======================================================
                HIGHLIGHTS
            ======================================================= */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              {highlights.map((highlight) => (

                <div
                  key={highlight}
                  className="flex items-start gap-3"
                >

                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#B8862F]/10 text-[#B8862F]">

                    <Check
                      size={13}
                      strokeWidth={2.5}
                    />

                  </div>

                  <p className="text-sm leading-6 text-slate-700">
                    {highlight}
                  </p>

                </div>

              ))}

            </div>


            {/* =======================================================
                CTA
            ======================================================= */}

            <div className="mt-10">

              <a
                href="#contact"
                className="group inline-flex items-center gap-3 border-b border-[#B8862F] pb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#081221] transition-colors duration-300 hover:text-[#B8862F]"
              >

                Learn More About Us

                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />

              </a>

            </div>

          </div>

        </div>


        {/* =========================================================
            BOTTOM STATEMENT
        ========================================================= */}

        <div className="mt-20 border-t border-slate-200 pt-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Rajasthan Estate Realtors · Since 1988
            </p>

            <p className="max-w-lg text-sm leading-6 text-slate-500 sm:text-right">
              Local knowledge. Personal relationships. Real estate guidance
              built over generations.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}

export default About;