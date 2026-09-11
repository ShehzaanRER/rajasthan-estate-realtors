import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, MessageCircle, Phone, Users } from "lucide-react";
import {
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_NUMBER,
} from "../../../lib/siteConfig";

const title = "About";
const description =
  "Rajasthan Estate Realtors is a family-run real estate consultancy in Jogeshwari, established in 1988. We advise buyers, sellers and tenants across Mumbai's Western Suburbs.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title,
    description,
    url: "/about",
  },
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
          3. TRUSTED SINCE 1988
      ========================================================= */}
      <section className="bg-[#081221] px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-10 bg-[#B8862F]" />
            <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#D4AF37]">
              Trusted Since 1988
            </p>
          </div>

          <h2 className="mb-10 max-w-2xl font-serif text-3xl font-light leading-tight text-white sm:text-4xl">
            Decades of local knowledge.
            <span className="block italic text-[#D4AF37]">
              Relationships you can trust.
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="border border-white/15 bg-[#101b2c]/70 p-6 backdrop-blur-sm">
              <BadgeCheck size={27} strokeWidth={1.5} className="mb-4 text-[#D4AF37]" />
              <div className="font-serif text-3xl text-white">1988</div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Established
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Founded in Jogeshwari and still run by the same family, helping
                clients make confident property decisions.
              </p>
            </div>

            <div className="border border-white/15 bg-[#101b2c]/70 p-6 backdrop-blur-sm">
              <MapPin size={27} strokeWidth={1.5} className="mb-4 text-[#D4AF37]" />
              <div className="font-serif text-3xl text-white">Local</div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Market Expertise
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Deep knowledge of Mumbai&apos;s Western Suburbs, from
                Jogeshwari and Andheri to Goregaon and beyond.
              </p>
            </div>

            <div className="border border-white/15 bg-[#101b2c]/70 p-6 backdrop-blur-sm">
              <Users size={27} strokeWidth={1.5} className="mb-4 text-[#D4AF37]" />
              <div className="font-serif text-3xl text-white">Personal</div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Client Guidance
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                A relationship-driven approach across residential and
                commercial property, from search through completion.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================================
          4. LIGHT CTA
      ========================================================= */}
      <section className="bg-white px-6 py-14 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-light leading-snug text-[#081221] sm:text-3xl">
            Looking for the right property in Mumbai&apos;s Western Suburbs?
          </h2>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center border border-[#081221] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              Explore Properties
            </Link>

            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 hover:text-[#B8862F]"
            >
              <Phone size={14} />
              Speak With Us
            </a>

            <a
              href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition-colors duration-300 hover:text-[#B8862F]"
            >
              <MessageCircle size={14} />
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
