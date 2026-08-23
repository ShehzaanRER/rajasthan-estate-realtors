import Link from "next/link";

function Navbar() {
  return (
    <nav className="relative z-50 w-full bg-white border-b border-slate-200 shadow-sm">

      <div className="mx-auto flex h-[88px] max-w-7xl items-center justify-between px-4 sm:h-[110px] sm:px-6 lg:px-8">

        {/* =========================================================
            BRAND
        ========================================================= */}

        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 sm:gap-6"
        >

          {/* House Logo */}

          <img
            src="/logo-HOUSE.svg"
            alt="Rajasthan Estate Realtors"
            className="h-16 w-auto shrink-0 object-contain sm:h-[100px]"
          />

          {/* Business Name */}

          <div className="min-w-0 flex flex-col justify-center">

            <h1 className="font-cormorant text-lg font-semibold leading-tight tracking-[-0.02em] text-slate-900 sm:text-2xl">
              Rajasthan Estate Realtors
            </h1>

            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-amber-600 sm:text-xs sm:tracking-[0.35em]">
              Since 1988
            </p>

          </div>

        </Link>


        {/* =========================================================
            NAVIGATION
        ========================================================= */}

        <ul className="hidden items-center gap-8 font-medium text-slate-700 md:flex">

          <li>
            <Link
              href="/"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              Home
            </Link>
          </li>

          <li>
            <Link
              href="/properties"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              Properties
            </Link>
          </li>

          <li>
            <a
              href="#services"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              Services
            </a>
          </li>

          <li>
            <a
              href="#areas"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              Areas
            </a>
          </li>

          <li>
            <Link
              href="/about"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              About
            </Link>
          </li>

          <li>
            <a
              href="#contact"
              className="text-base tracking-wide transition-colors duration-200 hover:text-amber-600"
            >
              Contact
            </a>
          </li>

        </ul>


        {/* =========================================================
            LOCATE US
        ========================================================= */}

        <a
          href="https://www.google.com/maps/search/?api=1&query=Rajasthan+Estate+Realtors+Mumbai"
          target="_blank"
          rel="noopener noreferrer"
          className="group hidden items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-800 transition-all duration-300 hover:border-amber-500 hover:text-amber-600 hover:shadow-md md:flex"
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

      </div>
    </nav>
  );
}

export default Navbar;
