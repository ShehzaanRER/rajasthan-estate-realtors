import { ArrowDown, ArrowRight } from "lucide-react";

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#081221]">

      {/* =========================================================
          HERO IMAGE
      ========================================================= */}

      <div className="absolute inset-0">

        <img
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=85"
          alt="Premium residential architecture in Mumbai"
          className="h-full w-full object-cover"
        />

        {/* Main cinematic overlay */}
        <div className="absolute inset-0 bg-[#07101d]/60" />

        {/* Left-side readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07101d]/90 via-[#07101d]/55 to-transparent" />

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081221] via-[#081221]/40 to-transparent" />

      </div>


      {/* =========================================================
          HERO CONTENT
      ========================================================= */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] items-center px-6 pb-20 pt-44 sm:px-10 md:px-16 lg:px-20">
        <div className="max-w-4xl">

          {/* EYEBROW */}

          <div className="mb-7 flex items-center gap-4">

            <span className="h-px w-12 bg-[#B8862F]" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
              Established 1988 · Mumbai
            </p>

          </div>


          {/* HEADLINE */}

          <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[6.5rem]">

            Find your place

            <span className="block italic text-[#D4AF37]">
              in Mumbai.
            </span>

          </h1>


          {/* SUPPORTING COPY */}

          <p className="mt-8 max-w-2xl text-base font-light leading-8 text-slate-200 sm:text-lg md:text-xl">

            Residential and commercial real estate across Mumbai's Western
            Suburbs, backed by local knowledge and a family legacy since 1988.

          </p>


          {/* CTA GROUP */}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">

            <a
              href="#properties"
              className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_40px_rgba(184,134,47,0.3)]"
            >

              Explore Properties

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />

            </a>


            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37] hover:bg-white/10 hover:text-[#D4AF37]"
            >

              Speak With Us

            </a>

          </div>

        </div>

      </div>


      {/* =========================================================
          SCROLL INDICATOR
      ========================================================= */}

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-white/60">

        <span className="text-[10px] uppercase tracking-[0.35em]">
          Explore
        </span>

        <ArrowDown
          size={18}
          className="animate-bounce text-[#D4AF37]"
        />

      </div>

    </section>
  );
}

export default Hero;