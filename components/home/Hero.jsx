import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CONTACT_PHONE_TEL } from "../../lib/siteConfig";

/**
 * Static hero. Its height follows its content rather than the viewport, so
 * the section never reserves empty space it has nothing to fill with.
 */
function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#07101d]">

      {/* BACKGROUND */}

      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-[#07101d]/60" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#07101d]/90 via-[#07101d]/55 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081221] via-[#081221]/40 to-transparent" />
      </div>

      {/* CONTENT */}

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 py-20 sm:px-10 md:px-16 md:py-28 lg:px-20 xl:px-24">

        <div className="max-w-3xl">

          <div className="mb-7 flex items-center gap-4">
            <span className="h-px w-12 bg-[#B8862F]" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
              Jogeshwari, Mumbai · Established 1988
            </p>
          </div>

          <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Find your place

            <span className="block italic text-[#D4AF37]">
              in Mumbai.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base font-light leading-7 text-slate-200 sm:text-lg">
            A family-run property consultancy in Jogeshwari since 1988, working
            across residential and commercial property in Mumbai&apos;s Western
            Suburbs.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/properties"
              className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_40px_rgba(184,134,47,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d]"
            >
              Explore Properties

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37] hover:bg-white/10 hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d]"
            >
              Speak With Us
            </a>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;
