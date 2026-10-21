import type { BannerAlign, BannerOverlay, BannerPlacement, BannerPosition } from './placements';

export type PublicBannerImage = {
  /** Desktop/tablet source — the `large` Media derivative, as a relative URL. */
  src: string;
  /** Optional portrait crop served below 768px. */
  mobileSrc: string | null;
  /** CSS object-position for the desktop source. */
  position: BannerPosition;
  /** CSS object-position below 768px. Equals `position` unless set. */
  mobilePosition: BannerPosition;
  /**
   * Only meaningful for the Our Story image. Hero and page-banner photographs
   * sit behind the heading that carries their meaning and render with
   * `alt=""`, so for those this is always empty.
   */
  alt: string;
};

export type PublicBannerCta = {
  label: string;
  /** Already checked by `safeBannerHref()`. */
  href: string;
};

/** A published, enabled Website Banners record, ready to render. */
export type PublicWebsiteBanner = {
  placement: BannerPlacement;
  image: PublicBannerImage | null;
  eyebrow: string | null;
  heading: string | null;
  accent: string | null;
  description: string | null;
  cta: PublicBannerCta | null;
  overlay: BannerOverlay;
  align: BannerAlign;
};

/**
 * What a page renders for a placement. `source: 'default'` means no eligible
 * CMS record exists and the page is showing its built-in design — the copy it
 * had before banners were editable, and no photograph.
 */
export type ResolvedBanner = PublicWebsiteBanner & {
  source: 'cms' | 'default';
};
