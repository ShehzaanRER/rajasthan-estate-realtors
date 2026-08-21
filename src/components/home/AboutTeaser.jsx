import { ArrowRight } from "lucide-react";

function AboutTeaser() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#F3EFE7] py-20 sm:py-24"
    >
      {/* =========================================================
          SUBTLE BACKGROUND DETAIL
      ========================================================= */}

      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[#E9E3D7]/50" />

      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#B8862F]/5 blur-3xl" />

      {/* =========================================================
          CONTENT
      ========================================================= */}

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">

        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">

          {/* =====================================================
              LEFT — STORY
          ===================================================== */}

          <div className="max-w-2xl">

            {/* Eyebrow */}

            <div className="mb-6 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#B8862F]">
                Our Story
              </p>

            </div>


            {/* Heading */}

            <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#081221] sm:text-6xl">

              A legacy

              <span className="block italic text-[#B8862F]">
                built on trust.
              </span>

            </h2>


            {/* Copy */}

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">

              Since 1988, Rajasthan Estate Realtors has helped families,
              businesses and investors navigate Mumbai's real estate market
              with local knowledge, honest advice and personal guidance.

            </p>


            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">

              What began as a family-run real estate consultancy has grown
              through relationships built over generations.

            </p>


            {/* CTA */}

            <a
              href="/about"
              className="group mt-8 inline-flex items-center gap-3 rounded-lg bg-[#081221] px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#152338] hover:shadow-lg"
            >
              Discover Our Story

              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

          </div>


          {/* =====================================================
              RIGHT — VISUAL
          ===================================================== */}

          <div className="relative">

            {/* Decorative frame */}

            <div className="absolute -bottom-4 -right-4 h-full w-full border border-[#B8862F]/40" />


            <div className="relative overflow-hidden bg-[#081221]">

              <img
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85"
                alt="Premium Mumbai residential property"
                className="h-[360px] w-full object-cover transition duration-700 hover:scale-105 sm:h-[400px]"
              />

              {/* Image overlay */}

              <div className="absolute inset-0 bg-gradient-to-t from-[#081221]/80 via-transparent to-transparent" />


              {/* 1988 marker */}

              <div className="absolute bottom-7 left-7">

                <p className="font-serif text-5xl font-light text-white">
                  1988
                </p>

                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-[#D4AF37]">
                  Our journey began
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default AboutTeaser;