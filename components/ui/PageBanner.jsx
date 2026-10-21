import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isExternalWebHref, isInternalHref } from "../../lib/website-banners/links";

/**
 * Detail-hero quality from the next.config.mjs allow-list (75/82/85/88).
 * Banners sit under a navy overlay, so 88's extra bytes would buy nothing
 * visible.
 */
const BANNER_QUALITY = 85;

/**
 * The photograph behind a banner, filling its positioned parent.
 *
 * `image` is a `PublicBannerImage` from lib/website-banners. As a backdrop it
 * is decorative — `alt=""` and `aria-hidden` — because the heading over it
 * carries the meaning. Pass `alt` when the photograph is itself content (the
 * homepage Our Story image).
 *
 * With a `mobileSrc` it renders a <picture>, so a phone downloads only the
 * portrait crop and a desktop only the landscape one. Without one, a single
 * image is re-framed per breakpoint through `object-position`.
 *
 * `priority` marks it as the page's LCP candidate. That is right for every
 * banner, which always opens the page; a below-the-fold use turns it off.
 */
export function BannerBackdrop({ image, priority = true, sizes = "100vw", alt = "" }) {
  const decorative = !alt;

  const shared = {
    alt,
    fill: true,
    sizes,
    quality: BANNER_QUALITY,
    ...(priority ? { fetchPriority: "high", loading: "eager" } : { loading: "lazy" }),
  };

  const className =
    "object-cover object-(--banner-pos-mobile) md:object-(--banner-pos)";
  const style = {
    "--banner-pos": image.position,
    "--banner-pos-mobile": image.mobilePosition,
  };

  if (!image.mobileSrc) {
    return (
      <Image
        {...shared}
        src={image.src}
        aria-hidden={decorative ? "true" : undefined}
        className={className}
        style={style}
      />
    );
  }

  // Art direction, per the next/image docs: one getImageProps() call per
  // source. A <picture> only ever fetches the source it selects, so eager
  // loading here does not download both files.
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...shared, src: image.src });

  const {
    props: { style: mobileStyle, ...mobileProps },
  } = getImageProps({ ...shared, src: image.mobileSrc });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} sizes={sizes} />
      <img
        {...mobileProps}
        alt={alt}
        aria-hidden={decorative ? "true" : undefined}
        className={className}
        style={{ ...mobileStyle, ...style }}
      />
    </picture>
  );
}

/**
 * Overlay recipes, one per CMS `overlay` option. Full class strings so
 * Tailwind can see them. `standard` is the treatment the banners were
 * designed with.
 *
 * - `base`  — tint over the whole image: heavier on phones, where the text
 *             spans the full width, lighter from md up.
 * - `fade`  — md-up left-to-right fade behind left-aligned text, letting the
 *             photograph show on the right.
 * - `even`  — the uniform tint used instead of both when text is centred.
 */
const PAGE_OVERLAYS = {
  light: {
    base: "bg-[#081221]/50 md:bg-[#081221]/20",
    fade: "from-[#081221]/80 via-[#081221]/40 to-transparent",
    even: "bg-[#081221]/50",
  },
  standard: {
    base: "bg-[#081221]/65 md:bg-[#081221]/35",
    fade: "from-[#081221]/90 via-[#081221]/55 to-[#081221]/5",
    even: "bg-[#081221]/65",
  },
  strong: {
    base: "bg-[#081221]/80 md:bg-[#081221]/55",
    fade: "from-[#081221]/95 via-[#081221]/75 to-[#081221]/35",
    even: "bg-[#081221]/80",
  },
};

/**
 * A banner call-to-action. Site paths go through next/link; external web
 * addresses open in a new tab; tel:/mailto: are plain links. `href` has
 * already passed `safeBannerHref()` in the mapper.
 */
export function BannerCta({ cta, className, children }) {
  if (isInternalHref(cta.href)) {
    return (
      <Link href={cta.href} className={className}>
        {children}
      </Link>
    );
  }

  const external = isExternalWebHref(cta.href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <a href={cta.href} className={className} {...external}>
      {children}
    </a>
  );
}

/**
 * The opening section of a public page: optional eyebrow, the page's single
 * <h1> with its italic gold second line, an intro paragraph and an optional
 * button.
 *
 * `banner` is a `ResolvedBanner` from lib/website-banners — the placement's
 * published Website Banners record, or the page's built-in design when there
 * is none. Without a photograph the section is the plain navy header the site
 * has always used; with one it gains height and an overlay that keeps the text
 * at the same contrast either way.
 */
function PageBanner({ banner }) {
  const { image, eyebrow, heading, accent, description, cta } = banner;
  const hasImage = Boolean(image);
  const centred = banner.align === "center";
  const overlay = PAGE_OVERLAYS[banner.overlay] ?? PAGE_OVERLAYS.standard;

  return (
    <section className="relative isolate overflow-hidden bg-[#081221]">
      {hasImage ? (
        <div className="absolute inset-0 -z-10">
          <BannerBackdrop image={image} />

          {centred ? (
            <div className={`absolute inset-0 ${overlay.even}`} />
          ) : (
            <>
              <div className={`absolute inset-0 ${overlay.base}`} />

              <div
                className={`absolute inset-0 hidden bg-gradient-to-r md:block ${overlay.fade}`}
              />
            </>
          )}

          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#081221]/70 to-transparent" />
        </div>
      ) : null}

      <div
        className={`mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8 ${
          hasImage ? "py-20 sm:py-24 lg:py-28" : "py-16"
        }`}
      >
        <div className={centred ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
          {eyebrow ? (
            <div
              className={`mb-6 flex items-center gap-4 ${centred ? "justify-center" : ""}`}
            >
              <span className="h-px w-12 bg-[#B8862F]" />
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                {eyebrow}
              </p>
              {centred ? <span className="h-px w-12 bg-[#B8862F]" /> : null}
            </div>
          ) : null}

          <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-tight text-white sm:text-6xl">
            {heading}
            {accent ? (
              <>
                {" "}
                <span className="block italic text-[#D4AF37]">{accent}</span>
              </>
            ) : null}
          </h1>

          {description ? (
            <p
              className={`mt-6 max-w-2xl text-base font-light leading-8 sm:text-lg ${
                hasImage ? "text-slate-200" : "text-slate-300"
              } ${centred ? "mx-auto" : ""}`}
            >
              {description}
            </p>
          ) : null}

          {cta ? (
            <div className="mt-8">
              <BannerCta
                cta={cta}
                className="group inline-flex select-none items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_15px_40px_rgba(184,134,47,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081221]"
              >
                {cta.label}

                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </BannerCta>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default PageBanner;
