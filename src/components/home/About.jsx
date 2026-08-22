import { ArrowRight, BadgeCheck, Handshake, MapPin, Users } from "lucide-react";

function About() {
  return (
    <main className="bg-white">

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#081221]">

        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#081221] via-[#081221]/95 to-[#081221]/70" />

          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-[#B8862F]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-6 py-10 sm:px-10 md:px-16 lg:px-8">

          <div className="max-w-4xl">

            <div className="mb-7 flex items-center gap-4">

              <span className="h-px w-12 bg-[#B8862F]" />

              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                Our Story · Since 1988
              </p>

            </div>

            <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              Built on trust.
              <span className="block italic text-[#D4AF37]">
                Rooted in Mumbai.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base font-light leading-8 text-slate-300 sm:text-lg">
              For more than three decades, Rajasthan Estate Realtors has
              helped families, businesses and investors navigate Mumbai's
              property market with personal guidance and local expertise.
            </p>

          </div>

        </div>
      </section>


      {/* =========================================================
          OUR STORY
      ========================================================= */}
      <section className="bg-[#F5F0E8] py-20 sm:py-24">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">

            <div>

              <div className="mb-6 flex items-center gap-4">

                <span className="h-px w-10 bg-[#B8862F]" />

                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
                  Our Story
                </p>

              </div>

              <h2 className="font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
                A family legacy built around
                <span className="block italic text-[#B8862F]">
                  relationships.
                </span>
              </h2>

            </div>

            <div className="space-y-5 text-base leading-8 text-slate-600 sm:text-lg">

              <p>
                Rajasthan Estate Realtors was established in 1988 with a
                simple belief: real estate should be built on trust,
                transparency and genuine relationships.
              </p>

              <p>
                Over the years, that belief has remained at the heart of how
                we work. Property decisions are significant, whether it is a
                family's next home, a business requirement or a long-term
                investment.
              </p>

              <p>
                Our approach is therefore personal. We take the time to
                understand what our clients are looking for, share our local
                knowledge and guide them through the process from the first
                conversation to the final transaction.
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
    FOUNDER / STORY
========================================================= */}
<section className="bg-white py-20 sm:py-10">

  <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

    <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">

      {/* =====================================================
          PORTRAIT
      ===================================================== */}

      <div className="relative mx-auto w-full max-w-md">

        <div className="absolute -bottom-5 -left-5 h-full w-full border border-[#B8862F]/30" />

        <div className="relative overflow-hidden bg-[#F5F0E8]">

          <img
            src="/Hanif_AboutUs.png"
            alt="Mr. Hanif Zamindar, Founder and Proprietor of Rajasthan Estate Realtors"
            className="block h-auto w-full object-cover"
          />

        </div>

        <div className="absolute bottom-5 right-5 bg-[#081221] px-5 py-3">

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Founder · Since 1988
          </p>

        </div>

      </div>


      {/* =====================================================
          FOUNDER STORY
      ===================================================== */}

      <div>

        <div className="mb-6 flex items-center gap-4">

          <span className="h-px w-10 bg-[#B8862F]" />

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Our Founder
          </p>

        </div>

        <h2 className="font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">

          Mr. Hanif Zamindar

          <span className="mt-2 block text-2xl italic text-[#B8862F] sm:text-3xl">
            Founder & Proprietor
          </span>

        </h2>

        <div className="mt-7 space-y-5 text-base leading-8 text-slate-600 sm:text-lg">

          <p>
    In 1988, Mr. Hanif Zamindar began Rajasthan Estate Realtors with a
    simple vision — to build a real estate business based on trust,
    personal relationships and a deep understanding of the local
    community.
  </p>

  <p>
    Starting out in Jogeshwari, he was among the early real estate agents
    serving the area as its property market began to evolve. What started
    as a local practice gradually grew through years of relationships,
    referrals and the trust of clients.
  </p>

  <p>
    More than three decades later, that legacy continues. Generations of
    families, property owners and investors have trusted Rajasthan Estate
    Realtors with important property decisions, while our approach remains
    rooted in the same principles — listening, understanding and earning
    our clients' trust.
  </p>


        </div>

      </div>

    </div>

  </div>

</section>


      {/* =========================================================
          VALUES
      ========================================================= */}
      <section className="bg-[#081221] py-20 sm:py-24">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
              What We Stand For
            </p>

            <h2 className="mt-4 font-serif text-4xl font-light text-white sm:text-5xl">
              The values behind
              <span className="italic text-[#D4AF37]"> every relationship.</span>
            </h2>

          </div>


          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {[
              {
                icon: <BadgeCheck size={30} />,
                title: "Trust",
                text: "Straightforward advice and relationships built for the long term.",
              },
              {
                icon: <Handshake size={30} />,
                title: "Personal Guidance",
                text: "A human approach to decisions that matter.",
              },
              {
                icon: <MapPin size={30} />,
                title: "Local Knowledge",
                text: "Deep understanding of Mumbai's Western Suburbs.",
              },
              {
                icon: <Users size={30} />,
                title: "Relationships",
                text: "A family-business approach that puts people first.",
              },
            ].map((item) => (

              <div
                key={item.title}
                className="border border-white/10 bg-white/[0.04] p-7 transition-colors duration-300 hover:border-[#B8862F]/60"
              >

                <div className="text-[#D4AF37]">
                  {item.icon}
                </div>

                <h3 className="mt-5 font-serif text-2xl text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.text}
                </p>

              </div>

            ))}

          </div>

        </div>
      </section>


      {/* =========================================================
          EXPERTISE
      ========================================================= */}
      <section className="bg-white py-20 sm:py-24">

        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">

          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-end">

            <div>

              <div className="mb-6 flex items-center gap-4">

                <span className="h-px w-10 bg-[#B8862F]" />

                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
                  Our Expertise
                </p>

              </div>

              <h2 className="font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">
                Real estate expertise across
                <span className="block italic text-[#B8862F]">
                  Mumbai's Western Suburbs.
                </span>
              </h2>

            </div>

            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              From finding a family home to evaluating a commercial
              opportunity, our experience covers a wide range of residential
              and commercial property requirements.
            </p>

          </div>


          <div className="mt-12 grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">

            {[
              "Residential Properties",
              "Commercial Properties",
              "Property Buying & Selling",
              "Property Rentals",
            ].map((service) => (

              <div
                key={service}
                className="bg-white px-7 py-8"
              >

                <p className="font-serif text-xl text-[#081221]">
                  {service}
                </p>

                <div className="mt-5 h-px w-8 bg-[#B8862F]" />

              </div>

            ))}

          </div>

        </div>
      </section>


      {/* =========================================================
          CTA
      ========================================================= */}
      <section className="bg-[#F5F0E8] py-16 sm:py-20">

        <div className="mx-auto max-w-5xl px-6 text-center sm:px-10">

          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
            Start a Conversation
          </p>

          <h2 className="mt-4 font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl md:text-6xl">
            Looking for the right property
            <span className="block italic text-[#B8862F]">
              in Mumbai?
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Tell us what you are looking for and let our team help you
            navigate your next property decision.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">

            <a
              href="/#properties"
              className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#081221] px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#14233A]"
            >
              Explore Properties

              <ArrowRight size={18} />

            </a>

            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              Speak With Us
            </a>

          </div>

        </div>
      </section>

    </main>
  );
}

export default About;