import Image from "next/image";

/**
 * Roughly twice the rendered card width, so the raster path still has real
 * pixels to spend on a high-DPI screen. Fixed rather than viewport-relative
 * because the card width is fixed at each breakpoint — a `vw` hint would make
 * next/image pick a much larger file than the card can ever show.
 */
const LOGO_SIZES = "(min-width: 1024px) 180px, (min-width: 640px) 160px, 140px";

/**
 * One white logo tile. `object-contain` plus intrinsic width/height is what
 * keeps every logo at its own aspect ratio: the box is a fixed size, the logo
 * fits inside it, and nothing is ever stretched or cropped.
 *
 * SVG uploads skip the optimizer entirely (see PublicPartnerLogo.isVector) —
 * rasterising a vector logo is the one thing guaranteed to make it soft.
 *
 * Deliberately not clickable. The CMS still records `websiteUrl` for each
 * partner, but the strip is a trust mark rather than a set of outbound links,
 * so nothing here renders an anchor.
 */
function PartnerLogoCard({ partner }) {
  const { logo } = partner;

  const logoImage = (
    <Image
      src={logo.url}
      alt={logo.alt}
      width={logo.width ?? 320}
      height={logo.height ?? 160}
      sizes={logo.isVector ? undefined : LOGO_SIZES}
      quality={logo.isVector ? undefined : 88}
      unoptimized={logo.isVector}
      loading="lazy"
      decoding="async"
      className="max-h-full w-auto max-w-full object-contain"
    />
  );

  const cardClasses =
    "flex h-[84px] w-[140px] shrink-0 select-none items-center justify-center rounded-lg border border-slate-200 bg-white px-5 shadow-[0_1px_3px_rgba(8,18,33,0.05)] sm:h-[96px] sm:w-[160px] lg:h-[104px] lg:w-[180px]";

  return <div className={cardClasses}>{logoImage}</div>;
}

export default PartnerLogoCard;
