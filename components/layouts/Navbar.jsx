"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const locateUsHref =
  "https://www.google.com/maps/search/?api=1&query=Rajasthan+Estate+Realtors+Mumbai";

/** Sellers land on the existing contact form with the requirement preselected. */
const SELL_PROPERTY_HREF = "/contact?intent=sell-property";

const NAV_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="relative z-50 w-full bg-white border-b border-slate-200 shadow-sm">

      <div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-4 sm:h-[110px] sm:px-6 lg:px-8">

        {/* =========================================================
            BRAND
        ========================================================= */}

        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 sm:gap-6 lg:gap-4 xl:gap-6"
          onClick={closeMenu}
        >

          {/* House Logo */}

          <img
            src="/logo-HOUSE.svg"
            alt=""
            className="h-16 w-auto shrink-0 object-contain sm:h-[100px] lg:h-[78px] xl:h-[100px]"
          />

          {/* Business Name */}

          <div className="min-w-0 flex flex-col justify-center">

            <p className="font-cormorant text-lg font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-2xl lg:text-xl xl:text-2xl">
              Rajasthan Estate Realtors
            </p>

            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-amber-600 sm:text-xs sm:tracking-[0.35em]">
              Since 1988
            </p>

          </div>

        </Link>


        {/* =========================================================
            NAVIGATION
        ========================================================= */}

        {/* Home is deliberately absent: the logo is the home link, and a nav
            that repeats it spends the most valuable slot in the bar on it. */}
        <ul className="hidden items-center gap-4 font-medium text-slate-700 lg:flex xl:gap-8">

          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
              >
                {label}
              </Link>
            </li>
          ))}

          {/* Sellers are a business journey of their own, so this gets modest
              emphasis rather than sitting level with the browse links. */}
          <li>
            <Link
              href={SELL_PROPERTY_HREF}
              className="inline-flex items-center whitespace-nowrap rounded-lg border border-[#B8862F] px-3.5 py-2 text-base font-medium text-[#081221] transition-colors duration-200 hover:bg-[#B8862F] hover:text-white xl:px-4"
            >
              Sell Property
            </Link>
          </li>

        </ul>


        {/* =========================================================
            LOCATE US
        ========================================================= */}

        <a
          href={locateUsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group hidden shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-800 transition-all duration-300 hover:border-amber-500 hover:text-amber-600 hover:shadow-md lg:flex xl:px-5"
        >

          {/* Location Icon */}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5 transition-colors duration-300 group-hover:text-amber-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
            />

            <circle
              cx="12"
              cy="10"
              r="2.3"
            />
          </svg>

          <span>
            Locate Us
          </span>

        </a>

        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-800 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
        </button>

      </div>

      {menuOpen ? (
        <div
          id={menuId}
          className="border-t border-slate-200 bg-white lg:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-4 font-medium text-slate-700">
            <li>
              <Link
                href="/"
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/properties"
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                Properties
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                href={SELL_PROPERTY_HREF}
                className="flex min-h-11 items-center py-3 text-base tracking-wide"
                onClick={closeMenu}
              >
                Sell Property
              </Link>
            </li>
            <li className="pt-2">
              <a
                href={locateUsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-base font-medium text-slate-800"
                onClick={closeMenu}
              >
                Locate Us
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

export default Navbar;
