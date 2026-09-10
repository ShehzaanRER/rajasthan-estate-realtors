import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaWhatsapp,
  FaGoogle,
} from "react-icons/fa";

import FooterCtaGate from "./FooterCtaGate";

function Footer() {
  return (
    <footer className="bg-[#081221] text-white">

      {/* =========================================================
    PREMIUM CTA
    Show on homepage only
========================================================= */}

      <FooterCtaGate>
        <section className="border-b border-white/10 bg-[#F5F0E8]">

          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 md:px-16 lg:px-8">

            <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">

              <div className="max-w-2xl">

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

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

                <a
                  href="#properties"
                  className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_35px_rgba(184,134,47,0.25)]"
                >
                  Explore Properties

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </a>

                <a
                  href="tel:+919892371329"
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

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 md:px-16 lg:px-8">

        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">


          {/* =====================================================
              BRAND
          ===================================================== */}

          <div>

            <Link
              href="/"
              className="inline-flex items-center gap-4"
            >

              <img
                src="/logo-HOUSE.svg"
                alt="Rajasthan Estate Realtors"
                className="h-20 w-auto object-contain"
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


            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
              A trusted real estate consultancy helping individuals,
              families and businesses navigate Mumbai's property market
              with local knowledge and personal guidance.
            </p>


            {/* =====================================================
                SOCIAL LINKS
            ===================================================== */}

            <div className="mt-7 flex items-center gap-3">

              {/* Instagram */}

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-[#B8862F] hover:text-[#D4AF37]"
              >
                <FaInstagram size={17} />
              </a>


              {/* Facebook */}

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-[#B8862F] hover:text-[#D4AF37]"
              >
                <FaFacebookF size={15} />
              </a>


              {/* LinkedIn */}

              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-[#B8862F] hover:text-[#D4AF37]"
              >
                <FaLinkedinIn size={16} />
              </a>


              {/* WhatsApp */}

              <a
                href="https://wa.me/919892371329"
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

          <div>

            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Explore
            </h4>

            <ul className="space-y-4 text-sm text-slate-400">

              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/properties"
                  className="transition-colors hover:text-white"
                >
                  Properties
                </Link>
              </li>

              <li>
                <Link
                  href="/projects"
                  className="transition-colors hover:text-white"
                >
                  New Projects
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?type=buy"
                  className="transition-colors hover:text-white"
                >
                  Buy Property
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?type=rent"
                  className="transition-colors hover:text-white"
                >
                  Rental Properties
                </Link>
              </li>

              <li>
                <Link
                  href="/properties?type=commercial"
                  className="transition-colors hover:text-white"
                >
                  Commercial Property
                </Link>
              </li>

            </ul>

          </div>


          {/* =====================================================
              COMPANY
          ===================================================== */}

          <div>

            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Company
            </h4>

            <ul className="space-y-4 text-sm text-slate-400">

              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-white"
                >
                  Contact Us
                </Link>
              </li>

            </ul>

          </div>


          {/* =====================================================
              CONTACT
          ===================================================== */}

          <div id="contact">

            <h4 className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Get In Touch
            </h4>


            <div className="space-y-5">


              {/* LOCATION */}

              <a
                href="https://www.google.com/maps/search/?api=1&query=Rajasthan+Estate+Realtors+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4"
              >

                <MapPin
                  size={19}
                  className="mt-1 shrink-0 text-[#B8862F]"
                />

                <span className="text-sm leading-6 text-slate-400 transition-colors group-hover:text-white">
                  Mumbai, Maharashtra
                </span>

              </a>


              {/* PHONE */}

              <a
                href="tel:+919892371329"
                className="group flex items-center gap-4"
              >

                <Phone
                  size={18}
                  className="shrink-0 text-[#B8862F]"
                />

                <span className="text-sm text-slate-400 transition-colors group-hover:text-white">
                  +91 98923 71329
                </span>

              </a>


              {/* WHATSAPP */}

              <a
                href="https://wa.me/919892371329"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4"
              >

                <FaWhatsapp
                  size={18}
                  className="shrink-0 text-[#B8862F]"
                />

                <span className="text-sm text-slate-400 transition-colors group-hover:text-white">
                  WhatsApp Us
                </span>

              </a>


              {/* EMAIL */}

              <a
                href="mailto:rajasthanestaterealtors@gmail.com"
                className="group flex items-center gap-4"
              >

                <Mail
                  size={18}
                  className="shrink-0 text-[#B8862F]"
                />

                <span className="text-sm text-slate-400 transition-colors group-hover:text-white">
                  rajasthanestaterealtors@gmail.com
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

                  <p className="mt-1 text-xs text-slate-500">
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
              className="group mt-7 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37] transition-colors hover:text-white"
            >

              Locate Us

              <ArrowRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />

            </a>

          </div>

        </div>


        {/* =========================================================
            GOOGLE TRUST STRIP
        ========================================================= */}

        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-y border-white/10 py-2 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <FaGoogle className="text-lg text-white" />

            <div>

              <p className="text-sm font-medium text-white">
                Find us on Google
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Read our latest client reviews
              </p>

            </div>

          </div>


          <a
            href="https://g.page/r/CfnKMudqeVu7EBk/review"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37] transition-colors hover:text-white"
          >

            Review Us on Google

            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />

          </a>

        </div>


        {/* =========================================================
            LEGAL / COPYRIGHT
        ========================================================= */}

        <div className="mt-7">

          <div className="flex flex-col gap-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">

            <p>
              © {new Date().getFullYear()} Rajasthan Estate Realtors.
              All Rights Reserved.
            </p>

            <div className="flex items-center gap-6">

              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="transition-colors hover:text-white"
              >
                Terms & Conditions
              </Link>

            </div>

          </div>

        </div>


        {/* =========================================================
            HERITAGE LINE
        ========================================================= */}

        <div className="mt-8 flex items-center justify-center gap-4">

          <span className="h-px w-12 bg-[#B8862F]/40" />

          <span className="text-[9px] font-medium uppercase tracking-[0.45em] text-slate-600">
            Established 1988 · Mumbai
          </span>

          <span className="h-px w-12 bg-[#B8862F]/40" />

        </div>

      </div>

    </footer>
  );
}

export default Footer;
