import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About | Rajasthan Estate Realtors, Jogeshwari since 1988",
  description:
    "Rajasthan Estate Realtors is a family-run real estate consultancy in Jogeshwari, established in 1988. We advise buyers, sellers and tenants across Mumbai's Western Suburbs.",
};

export default function AboutPage() {
  return (
    <main className="bg-white">

      {/* =========================================================
          1. INTRO
      ========================================================= */}
      <section className="bg-[#081221] px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B8862F]">
            Established 1988 · Jogeshwari
          </p>

          <h1 className="mt-5 font-serif text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
            Rajasthan Estate Realtors,
            <span className="mt-2 block italic text-[#B8862F]">
              Jogeshwari since 1988.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base font-light leading-8 text-slate-300 sm:text-lg">
            Built on trust and rooted in Mumbai. A family-run consultancy
            serving Jogeshwari and the Western Suburbs with local knowledge
            and personal guidance.
          </p>
        </div>
      </section>


      {/* =========================================================
          2. FOUNDER + HISTORY
      ========================================================= */}
      <section className="bg-[#F5F0E8] px-6 py-16 sm:px-10 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

          <div className="order-2 lg:order-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B8862F]">
              Established 1988
            </p>

            <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-[#081221] sm:text-4xl md:text-5xl">
              Mr. Hanif Zamindar
              <span className="mt-2 block text-xl italic text-[#B8862F] sm:text-2xl">
                Founder &amp; Proprietor
              </span>
            </h2>

            <div className="mt-6 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">
              <p>
                Rajasthan Estate Realtors was established in Jogeshwari in
                1988 and was one of the first real estate realtors in the
                area. Mr. Hanif Zamindar founded the business around personal
                relationships, trust and a close understanding of the local
                property market.
              </p>

              <p>
                As Jogeshwari and the Western Suburbs grew, so did a network
                of long-standing relationships with property owners, buyers,
                sellers, tenants and investors. The work remained local,
                personal and grounded in knowing the neighbourhood.
              </p>

              <p>
                Today, RER continues that relationship-led approach while
                helping clients across Jogeshwari and Mumbai&apos;s Western
                Suburbs make considered property decisions.
              </p>
            </div>
          </div>

          <figure className="order-1 lg:order-2">
            <div className="overflow-hidden bg-[#081221]/5">
              <Image
                src="/Hanif_AboutUs.jpg"
                alt="Mr. Hanif Zamindar, Founder and Proprietor of Rajasthan Estate Realtors"
                width={1200}
                height={800}
                sizes="(min-width: 1024px) 560px, 100vw"
                className="block h-auto w-full"
                priority
              />
            </div>
            <figcaption className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
              Mr. Hanif Zamindar · Founder &amp; Proprietor
            </figcaption>
          </figure>

        </div>
      </section>


      {/* =========================================================
          3. LOCAL EXPERTISE
      ========================================================= */}
      <section className="bg-white px-6 py-16 sm:px-10 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B8862F]">
            Our Approach
          </p>

          <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-[#081221] sm:text-4xl md:text-5xl">
            Local knowledge.
            <span className="block italic text-[#B8862F]">
              Personal guidance.
            </span>
          </h2>

          <div className="mt-6 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">
            <p>
              We work across Mumbai&apos;s Western Suburbs, with particular
              knowledge of Jogeshwari and the markets around it. Whether you
              are buying, selling or renting — residential or commercial —
              the starting point is the same: understand what you actually
              need.
            </p>

            <p>
              Local market knowledge and personal guidance then shape the
              search, the conversation and the decision. RER is built on
              relationships, not volume. The aim is to help clients move
              forward with a clear, informed view of the property in front
              of them.
            </p>
          </div>
        </div>
      </section>


      {/* =========================================================
          4. LIGHT CTA
      ========================================================= */}
      <section className="border-t border-slate-200 bg-white px-6 py-12 sm:px-10 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-light leading-snug text-[#081221] sm:text-3xl">
            Looking for the right property in Mumbai&apos;s Western Suburbs?
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/#properties"
              className="inline-flex items-center justify-center border border-[#081221] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              Explore Properties
            </Link>

            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 hover:text-[#B8862F]"
            >
              Speak With Us
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
