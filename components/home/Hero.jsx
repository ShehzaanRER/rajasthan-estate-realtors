import { ArrowRight } from "lucide-react";
import { CONTACT_PHONE_TEL } from "../../lib/siteConfig";
import HeroPropertySearch from "./HeroPropertySearch";
import { BannerBackdrop, BannerCta } from "../ui/PageBanner";

/**
 * Interim Unsplash-hosted backdrop, shown only while the homepage hero has no
 * published, enabled Website Banners record (`banner.source === "default"`).
 * Once RER's own photograph is published there, this constant and the srcSet
 * below are dead and can be deleted. A published record whose image has gone
 * missing gets the plain navy backdrop, not this photograph.
 *
 * Unsplash-hosted backdrop. It stays a plain <img> rather than next/image on
 * purpose: Unsplash already serves a correctly sized, content-negotiated
 * (WebP/AVIF) file from its own CDN, so routing it through /_next/image would
 * add a third-party fetch on our server and re-encode an already-compressed
 * image for no gain.
 *
 * What it was missing was resolution. It was pinned at a single w=1200 and
 * stretched across the full viewport by `h-full w-full object-cover`, so any
 * display wider than 1200px — and every 2x phone — was upscaling it. The
 * srcSet below lets the browser ask Unsplash for a size that matches the
 * device instead.
 */
const HERO_PHOTO_ID = "photo-1600607687920-4e2a09cf159d";

function heroSrc(width) {
  return `https://images.unsplash.com/${HERO_PHOTO_ID}?auto=format&fit=crop&w=${width}&q=80`;
}

const HERO_SRCSET = [640, 960, 1280, 1600, 1920, 2560]
  .map((width) => `${heroSrc(width)} ${width}w`)
  .join(", ");

/**
 * Overlay recipes for the CMS `overlay` option; `standard` is the hero's
 * original treatment. Full class strings so Tailwind can see them.
 */
const HERO_OVERLAYS = {
  light: {
    base: "bg-[#07101d]/45",
    fade: "from-[#07101d]/80 via-[#07101d]/40 to-transparent",
  },
  standard: {
    base: "bg-[#07101d]/60",
    fade: "from-[#07101d]/90 via-[#07101d]/55 to-transparent",
  },
  strong: {
    base: "bg-[#07101d]/75",
    fade: "from-[#07101d]/95 via-[#07101d]/70 to-[#07101d]/20",
  },
};

/**
 * Static hero. Its height follows its content rather than the viewport, so
 * the section never reserves empty space it has nothing to fill with.
 *
 * `banner` is the `home` placement from lib/website-banners (getHomeBanners):
 * photograph, eyebrow, heading, gold line, intro and the primary button are
 * all editable in Payload › Website Banners. The "Speak With Us" phone button
 * and the property search are fixed parts of the hero.
 *
 * The property search lives at the foot of the hero rather than in its own
 * homepage section, so finding a listing no longer costs a second scroll.
 */
function Hero({ banner, localities = [] }) {
  const overlay = HERO_OVERLAYS[banner.overlay] ?? HERO_OVERLAYS.standard;
  const showInterimPhoto = banner.source === "default";

  return (
    <section className="relative w-full overflow-hidden bg-[#07101d]">

      {/* BACKGROUND */}

      <div className="absolute inset-0">
        {banner.image ? (
          <BannerBackdrop image={banner.image} />
        ) : showInterimPhoto ? (
          <img
            src={heroSrc(1600)}
            srcSet={HERO_SRCSET}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}

        <div className={`absolute inset-0 ${overlay.base}`} />

        <div className={`absolute inset-0 bg-gradient-to-r ${overlay.fade}`} />

        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#081221] via-[#081221]/40 to-transparent" />
      </div>

      {/* CONTENT */}

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 py-20 sm:px-10 md:px-16 md:pt-[47px] md:pb-[47px] lg:px-20 xl:px-24">

        <div className="max-w-3xl">

          {banner.eyebrow ? (
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-12 bg-[#B8862F]" />

              <p className="select-none text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                {banner.eyebrow}
              </p>
            </div>
          ) : null}

          <h1 className="select-none font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
            {banner.heading}

            {banner.accent ? (
              <>
                {" "}
                <span className="block italic text-[#D4AF37]">
                  {banner.accent}
                </span>
              </>
            ) : null}
          </h1>

          {banner.description ? (
            <p className="mt-7 max-w-2xl select-none text-base font-light leading-7 text-slate-200 sm:text-lg">
              {banner.description}
            </p>
          ) : null}

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            {banner.cta ? (
              <BannerCta
                cta={banner.cta}
                className="group inline-flex select-none items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_40px_rgba(184,134,47,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d]"
              >
                {banner.cta.label}

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </BannerCta>
            ) : null}

            <a
              href={`tel:${CONTACT_PHONE_TEL}`}
              className="inline-flex select-none items-center justify-center rounded-lg border border-white/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D4AF37] hover:bg-white/10 hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07101d]"
            >
              Speak With Us
            </a>
          </div>

        </div>

        <div className="mt-10 max-w-5xl sm:mt-12 md:mt-14">
          <HeroPropertySearch localities={localities} />
        </div>

      </div>

    </section>
  );
}

export default Hero;
