import type { Media, WebsiteBanner } from '../../payload-types';
import { toDeliveryImage } from '../mediaUrl';
import { safeBannerHref } from './links';
import {
  isBannerAlign,
  isBannerOverlay,
  isBannerPlacement,
  isBannerPosition,
  placementKind,
} from './placements';
import type { PublicBannerImage, PublicWebsiteBanner } from './types';

const SVG_MIME_TYPE = 'image/svg+xml';

function textOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * A Media relationship the site can actually serve: populated (depth >= 1),
 * with a URL, and raster — an SVG has no `large` derivative and would be
 * rasterised by next/image. Anything else is treated as no image at all, so a
 * deleted or half-uploaded file never becomes a broken <img>.
 */
function deliverableMedia(value: number | Media | null | undefined): Media | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (typeof value.url !== 'string' || value.url.length === 0 || value.mimeType === SVG_MIME_TYPE) {
    return null;
  }

  return value;
}

function toBannerImage(doc: WebsiteBanner, withAlt: boolean): PublicBannerImage | null {
  const desktop = deliverableMedia(doc.desktopImage);

  // The desktop image is the banner's image. A mobile crop on its own is not
  // promoted to every breakpoint.
  if (!desktop) {
    return null;
  }

  const mobile = deliverableMedia(doc.mobileImage);
  const position = isBannerPosition(doc.desktopPosition) ? doc.desktopPosition : 'center';
  const mobilePosition = isBannerPosition(doc.mobilePosition) ? doc.mobilePosition : position;

  return {
    src: toDeliveryImage(desktop).url,
    mobileSrc: mobile ? toDeliveryImage(mobile).url : null,
    position,
    mobilePosition,
    alt: withAlt ? (textOrNull(doc.imageAlt) ?? textOrNull(desktop.alt) ?? '') : '',
  };
}

/**
 * The only place a Website Banners document becomes a `PublicWebsiteBanner`.
 *
 * Refuses anything that is not published and enabled, even though the query
 * and the collection's read access already exclude those — the same
 * belt-and-braces `mapProperty()` applies to non-public listings. Fields the
 * placement does not use are dropped rather than passed through, so a value
 * left behind from an earlier edit cannot surface somewhere unexpected.
 */
export function mapWebsiteBanner(doc: WebsiteBanner): PublicWebsiteBanner | null {
  if (!doc || doc._status !== 'published' || doc.enabled !== true) {
    return null;
  }

  if (!isBannerPlacement(doc.placement)) {
    return null;
  }

  const kind = placementKind(doc.placement);
  const hasText = kind === 'hero' || kind === 'page';

  const ctaLabel = textOrNull(doc.ctaLabel);
  const ctaHref = safeBannerHref(doc.ctaUrl);

  return {
    placement: doc.placement,
    image: toBannerImage(doc, kind === 'image'),
    eyebrow: hasText ? textOrNull(doc.eyebrow) : null,
    heading: hasText ? textOrNull(doc.heading) : null,
    accent: hasText ? textOrNull(doc.headingAccent) : null,
    description: hasText ? textOrNull(doc.description) : null,
    cta: hasText && doc.showCta && ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : null,
    overlay: isBannerOverlay(doc.overlay) ? doc.overlay : 'standard',
    align: kind === 'page' && isBannerAlign(doc.textAlign) ? doc.textAlign : 'left',
  };
}
