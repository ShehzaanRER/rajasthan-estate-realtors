import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * A homepage introduction, not a second About page. Two facts and one sentence
 * carry the positioning; /about carries the history. The text column is held to
 * a reading measure so the section reads as editorial rather than as a
 * full-width marketing statement.
 */
const FACTS = [
  { label: "Established", value: "1988" },
  { label: "Based in", value: "Jogeshwari, Mumbai" },
];

function AboutTeaser() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-white pt-8 pb-[30px] sm:pt-10 sm:pb-[38px] lg:pt-12 lg:pb-[46px]"
    >
      {/* Grounds the image side of the two-column composition. There is no
          such side in the single-column mobile layout. */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/3 bg-rer-sand lg:block" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">

        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">

          {/* =====================================================
              LEFT — STORY
          ===================================================== */}

          <div className="max-w-lg">

            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-12 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#B8862F]">
                Our Story
              </p>
            </div>

            <h2 className="font-serif text-4xl font-light leading-[1.02] tracking-tight text-[#081221] sm:text-5xl">
              A legacy

              <span className="block italic text-[#B8862F]">
                built on trust.
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600">
              RER has always been built on relationships rather than volume. The
              starting point is the same every time — understand what you
              actually need, then say honestly what the market will and will not
              give you.
            </p>

            <dl className="mt-7 flex flex-wrap gap-x-12 gap-y-5 border-t border-[#081221]/10 pt-6">
              {FACTS.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#B8862F]">
                    {label}
                  </dt>

                  <dd className="mt-1.5 font-serif text-xl text-[#081221]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href="/about"
              className="group mt-8 inline-flex items-center gap-3 rounded-lg bg-[#081221] px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#152338] hover:shadow-lg"
            >
              Discover Our Story

              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

          </div>


          {/* =====================================================
              RIGHT — VISUAL
          ===================================================== */}

          <div className="relative">

            <div className="absolute -bottom-4 -right-4 hidden h-full w-full border border-[#B8862F]/40 lg:block" />

            <div className="relative overflow-hidden bg-[#081221]">
              <img
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80"
                alt="Premium Mumbai residential property"
                className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[360px]"
              />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default AboutTeaser;
