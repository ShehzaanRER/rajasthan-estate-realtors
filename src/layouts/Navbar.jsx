import { useEffect, useState } from "react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-10 left-0 w-full z-50 bg-white shadow-sm border-b border-slate-200 transition-all duration-300 ${
        scrolled ? "py-2" : "py-5"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <div className="flex items-center gap-4">

          <img
            src="/logo.svg"
            alt="Rajasthan Estate Realtors"
            className={`w-auto transition-all duration-300 ${
              scrolled ? "h-[100px]" : "h-[140px]"
            }`}
          />

          <div>
            <h2
              className={`font-bold text-slate-900 transition-all duration-300 ${
                scrolled ? "text-lg" : "text-xl"
              }`}
            >
              Rajasthan Estate Realtors
            </h2>

            <p className="text-xs uppercase tracking-[0.3em] text-amber-500">
              Since 1988
            </p>
          </div>

        </div>

        {/* Navigation */}
        <ul className="hidden items-center gap-10 text-slate-700 md:flex">

          <li className="cursor-pointer transition hover:text-amber-500">
            Home
          </li>

          <li className="cursor-pointer transition hover:text-amber-500">
            Properties
          </li>

          <li className="cursor-pointer transition hover:text-amber-500">
            Services
          </li>

          <li className="cursor-pointer transition hover:text-amber-500">
            Areas
          </li>

          <li className="cursor-pointer transition hover:text-amber-500">
            About
          </li>

          <li className="cursor-pointer transition hover:text-amber-500">
            Contact
          </li>

        </ul>

        {/* WhatsApp Button */}
        <a
          href="https://wa.me/919892371329"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          WhatsApp
        </a>

      </div>
    </nav>
  );
}

export default Navbar;