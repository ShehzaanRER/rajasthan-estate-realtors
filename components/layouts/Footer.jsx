import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { FaWhatsapp, FaGoogle } from "react-icons/fa";

import FooterAccordion from "./FooterAccordion";
import FooterCtaGate from "./FooterCtaGate";
import {
  CONTACTS,
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_NUMBER,
} from "../../lib/siteConfig";

function Footer() {
  return (
    <footer className="bg-[#081221] text-white">

      {/* =========================================================
    PREMIUM CTA
    Show on homepage only
========================================================= */}

      <FooterCtaGate>
        <section className="border-b border-white/10 bg-[#F5F0E8]">

          <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 md:px-16 lg:px-8">

            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

              <div className="min-w-0 max-w-2xl">

                <div className="mb-4 flex items-center gap-4">

                  <span className="h-px w-10 bg-[#B8862F]" />

                  <span className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                    Let's Find The Right Property
                  </span>

                </div>

                <h2 className="font-serif text-4xl font-light leading-tight text-[#081221] sm:text-5xl">

                  Looking for the right property

                  <span className="block italic text-[#B8862F]">
                    in Mumbai?
                  </span>

                </h2>

                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Whether you are buying, selling, renting or exploring a
                  commercial opportunity, our team is here to guide you.
                </p>

              </div>

              {/* shrink-0 keeps the two actions at their natural width: once
                  the row layout kicks in at md, the heading beside them would
                  otherwise squeeze this group until the button labels wrap. */}
              <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">

                <Link
                  href="/properties"
                  className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_35px_rgba(184,134,47,0.25)]"
                >
                  Explore Properties

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="inline-flex items-center justify-center gap-3 rounded-lg border border-[#081221]/20 px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
                >
                  Speak With Us
                </a>

              </div>

            </div>

          </div>

        </section>
      </FooterCtaGate>


      {/* =========================================================
          MAIN FOOTER
      ========================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-9 sm:px-10 md:px-16 lg:px-8">

        <div className="grid gap-x-10 gap-y-0 md:gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">


          {/* =====================================================
              BRAND
          ===================================================== */}

          {/* The brand block is never collapsed — it is the footer's identity. */}
          <div className="mb-6 md:mb-0">

            <Link
              href="/"
              className="inline-flex items-center gap-4"
            >

              <img
                src="/logo-HOUSE-white.svg"
                alt="Rajasthan Estate Realtors"
                className="h-14 w-auto object-contain"
              />

              <div>

                <h3 className="font-cormorant text-xl font-semibold tracking-[-0.02em]">
                  Rajasthan Estate Realtors
                </h3>

                <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.35em] text-[#D4AF37]">
                  Since 1988
                </p>

              </div>

            </Link>


            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              A family-run property consultancy in Jogeshwari since 1988,
              working with buyers, sellers, tenants and investors across
              Mumbai's Western Suburbs.
            </p>


            {/* =====================================================
                SOCIAL LINKS
            ===================================================== */}

            <div className="mt-6 flex items-center gap-3">

              {/* WhatsApp */}

              <a
                href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-[#B8862F] hover:text-[#D4AF37]"
              >
                <FaWhatsapp size={18} />
              </a>


              {/* Google Reviews */}

              <a
                href="https://g.page/r/CfnKMudqeVu7EBk/review"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google Reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-[#B8862F] hover:text-[#D4AF37]"
              >
                <FaGoogle size={16} />
              </a>

            </div>

          </div>


          {/* =====================================================
              EXPLORE
          ===================================================== */}

          <FooterAccordion title="Explore">

            <ul className="space-y-3 text-sm text-slate-300">

              <li>
                <Link
                  href="/"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/properties"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Properties
                </Link>
              </li>

              <li>
                <Link
                  href="/projects"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  New Projects
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?for=buy&category=residential"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Buy Property
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?for=rent&category=residential"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Rental Properties
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?category=commercial"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Commercial Property
                </Link>
              </li>

            </ul>

          </FooterAccordion>


          {/* =====================================================
              COMPANY
          ===================================================== */}

          <FooterAccordion title="Company">

            <ul className="space-y-3 text-sm text-slate-300">

              <li>
                <Link
                  href="/about"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="inline-block py-1.5 transition-colors hover:text-white md:py-0.5"
                >
                  Contact Us
                </Link>
              </li>

            </ul>

          </FooterAccordion>


          {/* =====================================================
              CONTACT
          ===================================================== */}

          <FooterAccordion title="Get In Touch" id="contact">

            <div className="space-y-5">


              {/* LOCATION */}

              <a
                href="https://www.google.com/maps/search/?api=1&query=Rajasthan+Estate+Realtors+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 py-1.5 md:py-0"
              >

                <MapPin
                  size={19}
                  className="mt-1 shrink-0 text-[#B8862F]"
                />

                <span className="text-sm leading-6 text-slate-300 transition-colors group-hover:text-white">
                  Mumbai, Maharashtra
                </span>

              </a>


              {/* PHONE — both numbers, without names (names live on /contact only) */}

              <div className="flex items-start gap-4">

                <Phone
                  size={18}
                  className="mt-1 shrink-0 text-[#B8862F]"
                />

                <div className="flex flex-col">
                  {CONTACTS.map((contact) => (
                    <a
                      key={contact.tel}
                      href={`tel:${contact.tel}`}
                      className="inline-block py-2 text-sm text-slate-300 transition-colors hover:text-white md:py-0.5"
                    >
                      {contact.display}
                    </a>
                  ))}
                </div>

              </div>


              {/* WHATSAPP */}

              <a
                href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 py-1.5 md:py-0"
              >

                <FaWhatsapp
                  size={18}
                  className="shrink-0 text-[#B8862F]"
                />

                <span className="text-sm text-slate-300 transition-colors group-hover:text-white">
                  WhatsApp Us
                </span>

              </a>


              {/* EMAIL */}

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group flex items-center gap-4 py-1.5 md:py-0"
              >

                <Mail
                  size={18}
                  className="shrink-0 text-[#B8862F]"
                />

                <span className="text-sm text-slate-300 transition-colors group-hover:text-white">
                  {CONTACT_EMAIL}
                </span>

              </a>


              {/* BUSINESS HOURS */}

              <div className="flex items-start gap-4">

                <Clock
                  size={18}
                  className="mt-0.5 shrink-0 text-[#B8862F]"
                />

                <div>

                  <p className="text-sm text-slate-300">
                    Mon – Sat
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    10:00 AM – 9:00 PM
                  </p>

                </div>

              </div>

            </div>


            {/* LOCATION BUTTON */}

            <a
              href="https://www.google.com/maps/search/?api=1&query=Rajasthan+Estate+Realtors+Mumbai"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-5 inline-flex min-h-11 items-center gap-2 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] transition-colors hover:text-white md:min-h-0"
            >

              Locate Us

              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />

            </a>

          </FooterAccordion>

        </div>


        {/* =========================================================
            GOOGLE TRUST STRIP
        ========================================================= */}

        {/* One compact trust line rather than a full-width two-line block. */}
        <div className="mt-10 border-t border-white/10 pt-6">

          <a
            href="https://g.page/r/CfnKMudqeVu7EBk/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:text-white md:min-h-0 md:py-0"
          >
            <FaGoogle className="shrink-0 text-[#D4AF37]" />
            Read our client reviews on Google
          </a>

        </div>


        {/* =========================================================
            LEGAL / COPYRIGHT
        ========================================================= */}

        <div className="mt-6">

          <div className="flex flex-col gap-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">

            <p>
              © {new Date().getFullYear()} Rajasthan Estate Realtors.
              All Rights Reserved.
            </p>

            <div className="flex items-center gap-6">

              <Link
                href="/privacy-policy"
                className="inline-block py-2.5 transition-colors hover:text-white md:py-0.5"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="inline-block py-2.5 transition-colors hover:text-white md:py-0.5"
              >
                Terms & Conditions
              </Link>

            </div>

          </div>

        </div>


      </div>

    </footer>
  );
}

export default Footer;
