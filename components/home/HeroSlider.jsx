"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Home,
  KeyRound,
  MapPin,
  Users,
} from "lucide-react";

function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // =========================================================
    // SLIDE 1 — ORIGINAL HERO
    // =========================================================
    {
      id: 1,
      type: "hero",
      content: (
        <>
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-[#B8862F]" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
              Established 1988 · Mumbai
            </p>
          </div>

          <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[6.5rem]">
            Find your place

            <span className="block italic text-[#D4AF37]">
              in Mumbai.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-base font-light leading-7 text-slate-200 sm:text-lg md:text-xl">
            Residential and commercial real estate across Mumbai's Western
            Suburbs, backed by local knowledge and a family legacy since 1988.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="#properties"
              className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_40px_rgba(184,134,47,0.3)]"
            >
              Explore Properties

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>

            <a
              href="tel:+919892371329"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37] hover:bg-white/10 hover:text-[#D4AF37]"
            >
              Speak With Us
            </a>
          </div>
        </>
      ),
    },

    // =========================================================
    // SLIDE 2 — SERVICES
    // =========================================================
    {
      id: 2,
      type: "services",
      content: (
        <>
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-[#B8862F]" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#B8862F]">
              What We Do
            </p>
          </div>

          <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-[#081221] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Real estate

            <span className="block italic text-[#C79A32]">
              made simple.
            </span>
          </h2>

          <p className="mt-6 max-w-3xl text-base font-light leading-7 text-slate-600 sm:text-lg">
            Whether you are buying your next home, selling a property,
            looking for a rental or exploring a commercial opportunity, our
            team can guide you through the process.
          </p>

          {/* SERVICES */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">

            {/* BUY */}
            <div className="group border border-slate-300 bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#B8862F] hover:bg-white">
              <Home
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#C79A32]"
              />

              <h3 className="font-serif text-2xl text-[#081221]">
                Buy
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Find the right home or investment opportunity.
              </p>

              <a
                href="#properties"
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8862F]"
              >
                Explore
                <ArrowRight size={13} />
              </a>
            </div>

            {/* SELL */}
            <div className="group border border-slate-300 bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#B8862F] hover:bg-white">
              <KeyRound
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#C79A32]"
              />

              <h3 className="font-serif text-2xl text-[#081221]">
                Sell
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Position your property and reach serious buyers.
              </p>

              <a
                href="#contact"
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8862F]"
              >
                Explore
                <ArrowRight size={13} />
              </a>
            </div>

            {/* RENT */}
            <div className="group border border-[#B8862F] bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1">
              <Home
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#C79A32]"
              />

              <h3 className="font-serif text-2xl text-[#081221]">
                Rent
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Residential and commercial rental assistance.
              </p>

              <a
                href="#contact"
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8862F]"
              >
                Explore
                <ArrowRight size={13} />
              </a>
            </div>

            {/* COMMERCIAL */}
            <div className="group border border-slate-300 bg-white/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#B8862F] hover:bg-white">
              <Building2
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#C79A32]"
              />

              <h3 className="font-serif text-2xl text-[#081221]">
                Commercial
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Office, retail and commercial opportunities.
              </p>

              <a
                href="#contact"
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B8862F]"
              >
                Explore
                <ArrowRight size={13} />
              </a>
            </div>

          </div>

          <a
            href="#contact"
            className="mt-7 inline-flex items-center gap-3 rounded-lg bg-[#081221] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-[#152338]"
          >
            Discuss Your Requirement
            <ArrowRight size={17} />
          </a>
        </>
      ),
    },

    // =========================================================
    // SLIDE 3 — EXPERIENCE
    // =========================================================
    {
      id: 3,
      type: "experience",
      content: (
        <>
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-[#B8862F]" />

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37]">
              Why Rajasthan Estate Realtors
            </p>
          </div>

          <h2 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            Experience that

            <span className="block italic text-[#D4AF37]">
              makes a difference.
            </span>
          </h2>

          <p className="mt-6 max-w-3xl text-base font-light leading-7 text-slate-300 sm:text-lg">
            For more than three decades, we have helped individuals, families
            and businesses navigate Mumbai's real estate market with local
            knowledge and personal guidance.
          </p>

          {/* EXPERIENCE CARDS */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">

            {/* 35+ */}
            <div className="border border-white/15 bg-[#101b2c]/70 p-5 backdrop-blur-sm">
              <BadgeCheck
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#D4AF37]"
              />

              <div className="font-serif text-3xl text-white">
                35+
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Years of Experience
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Established in 1988, with decades of experience helping clients
                make confident real estate decisions.
              </p>
            </div>

            {/* LOCAL */}
            <div className="border border-white/15 bg-[#101b2c]/70 p-5 backdrop-blur-sm">
              <MapPin
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#D4AF37]"
              />

              <div className="font-serif text-3xl text-white">
                Local
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Market Expertise
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Deep knowledge of Mumbai's Western Suburbs, from Jogeshwari
                and Andheri to Goregaon and beyond.
              </p>
            </div>

            {/* PERSONAL */}
            <div className="border border-white/15 bg-[#101b2c]/70 p-5 backdrop-blur-sm">
              <Users
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#D4AF37]"
              />

              <div className="font-serif text-3xl text-white">
                Personal
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Client Guidance
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                A relationship-driven approach with personal attention from
                property search through completion.
              </p>
            </div>

            {/* COMPLETE SUPPORT */}
            <div className="border border-white/15 bg-[#101b2c]/70 p-5 backdrop-blur-sm">
              <Building2
                size={27}
                strokeWidth={1.5}
                className="mb-4 text-[#D4AF37]"
              />

              <div className="font-serif text-3xl text-white">
                360°
              </div>

              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                Real Estate Support
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Residential and commercial property expertise across buying,
                selling, renting and investment.
              </p>
            </div>

          </div>
        </>
      ),
    },
  ];

  // =========================================================
  // AUTO SLIDE
  // =========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  return (
    <section
      className="
        relative
        min-h-[650px]
        h-[calc(100vh-160px)]
        w-full
        overflow-hidden
      "
    >

      {/* =======================================================
          SLIDES
      ======================================================= */}

      {slides.map((slide, index) => {

        const isActive = index === currentSlide;

        return (
          <div
            key={slide.id}
            className={`
              absolute
              inset-0
              transition-opacity
              duration-700
              ease-in-out
              ${
                isActive
                  ? "z-10 opacity-100"
                  : "z-0 opacity-0 pointer-events-none"
              }
            `}
          >

            {/* =================================================
                SLIDE 1 BACKGROUND
            ================================================= */}

            {slide.type === "hero" && (
              <div className="absolute inset-0">

                <img
                  src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=85"
                  alt="Premium residential architecture in Mumbai"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-[#07101d]/60" />

                <div className="absolute inset-0 bg-gradient-to-r from-[#07101d]/90 via-[#07101d]/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081221] via-[#081221]/40 to-transparent" />

              </div>
            )}

            {/* =================================================
                SLIDE 2 BACKGROUND
            ================================================= */}

            {slide.type === "services" && (
              <div className="absolute inset-0 bg-[#F3EFE7]">

                <div className="absolute right-0 top-0 h-full w-[48%] bg-[#E9E3D7]" />

                <div className="absolute right-[18%] top-0 h-full w-px bg-[#D9D0C1]" />

                <div className="absolute bottom-0 right-[5%] h-[55%] w-[30%] rounded-t-full bg-[#E3DBCD]/50 blur-3xl" />

              </div>
            )}

            {/* =================================================
                SLIDE 3 BACKGROUND
            ================================================= */}

            {slide.type === "experience" && (
              <div className="absolute inset-0 bg-[#081221]">

                <div className="absolute inset-0 bg-gradient-to-r from-[#07101d] via-[#081221] to-[#101c2d]" />

                <div className="absolute right-0 top-0 h-full w-[48%] bg-gradient-to-l from-[#172438]/40 to-transparent" />

                <div className="absolute right-[8%] top-[15%] h-[60%] w-[35%] rounded-full bg-[#152338]/40 blur-3xl" />

              </div>
            )}

            {/* =================================================
    CONTENT VIEWPORT
================================================= */}

<div className="relative z-10 flex h-full w-full items-center">

  <div
    className="
      mx-auto
      flex
      w-full
      max-w-[1600px]
      items-center
      px-6
      py-16
      sm:px-10
      md:px-16
      lg:px-20
      xl:px-24
    "
  >

    <div
      className={`w-full max-w-6xl ${
        slide.id === 1
          ? "-translate-y-18"
          : slide.id === 2
          ? "-translate-y--100"
          : slide.id === 3
          ? "-translate-y-4"
          : ""
      }`}
    >
      {slide.content}
    </div>

  </div>

</div>

</div>
        );
      })}

      {/* =======================================================
          SLIDE COUNTER
      ======================================================= */}

      <div className="absolute bottom-7 left-6 z-30 flex items-center gap-3 text-white sm:left-10 md:left-16 lg:left-20">

        <span className="text-sm font-medium">
          {String(currentSlide + 1).padStart(2, "0")}
        </span>

        <span className="h-px w-8 bg-white/40" />

        <span className="text-[10px] tracking-[0.2em] text-white/50">
          03
        </span>

      </div>

      {/* =======================================================
          EXPLORE INDICATOR
      ======================================================= */}

      {currentSlide === 0 && (
        <div className="absolute bottom-7 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 sm:flex">

          <span className="text-[9px] uppercase tracking-[0.35em]">
            Explore
          </span>

          <ArrowDown
            size={17}
            className="animate-bounce text-[#D4AF37]"
          />

        </div>
      )}

      {/* =======================================================
          NAVIGATION
      ======================================================= */}

      <div className="absolute bottom-7 right-6 z-30 flex items-center gap-3 sm:right-10 md:right-16 lg:right-20">

        <button
          onClick={previousSlide}
          aria-label="Previous slide"
          className={`
            flex h-9 w-9 items-center justify-center rounded-full
            border transition-all duration-300
            ${
              currentSlide === 1
                ? "border-slate-400 bg-white/30 text-slate-700 hover:bg-white"
                : "border-white/30 bg-white/5 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]"
            }
          `}
        >
          <ArrowLeft size={16} />
        </button>

        {/* DOTS */}

        <div className="flex items-center gap-2">

          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${
                  currentSlide === index
                    ? "w-7 bg-[#D4AF37]"
                    : currentSlide === 1
                    ? "w-1.5 bg-slate-400"
                    : "w-1.5 bg-white/40"
                }
              `}
            />
          ))}

        </div>

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className={`
            flex h-9 w-9 items-center justify-center rounded-full
            border transition-all duration-300
            ${
              currentSlide === 1
                ? "border-slate-400 bg-white/30 text-slate-700 hover:bg-white"
                : "border-white/30 bg-white/5 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]"
            }
          `}
        >
          <ArrowRight size={16} />
        </button>

      </div>

    </section>
  );
}

export default HeroSlider;