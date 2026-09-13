import type { Media } from '../payload-types';
import { SITE_URL } from './siteConfig';

/**
 * Payload's `serverURL` config (needed for the admin panel/API) makes it emit
 * fully-qualified media URLs. Converting back to a relative path here means
 * next/image and the browser fetch these from this same app directly,
 * instead of the server making a self-referential external HTTP request to
 * its own public domain to optimize its own images.
 *
 * Shared by lib/properties/mapProperty.ts and lib/projects/mapProject.ts.
 *
 * Deliberately named `lib/mediaUrl.ts` rather than `lib/media/...` — a
 * directory literally named `media` matches the bare `media` entry in
 * .gitignore (meant for Payload's local upload storage folder) at any
 * depth, which would silently keep this file untracked.
 */
export function toRelativeMediaUrl(url: string): string {
  if (url.startsWith(SITE_URL)) {
    return url.slice(SITE_URL.length) || '/';
  }

  return url;
}

/**
 * Widest variant next/image is ever asked to produce for this site. Every
 * `sizes` attribute in the property/project components tops out at 100vw, and
 * Next's default deviceSizes step above 2048 is 3840 — but 2048 is the widest
 * that any layout here actually renders into. A delivery source at least this
 * wide can satisfy every request without the optimizer having to enlarge.
 */
const WIDEST_RENDERED_VARIANT = 2048;

/**
 * What the public site should hand to next/image for a Media doc.
 *
 * Prefers the bounded `large` derivative from collections/Media.ts — a
 * <=4096px WebP — over the original upload, which for real property
 * photography is an 8064x6048 / 28 MB camera file. next/image fetches and
 * fully decodes whatever it is given before it can resize, so pointing it at
 * originals meant a 48-megapixel decode per generated width (2.7-6.5s on a
 * cold cache). From the bounded derivative the same request is a sub-500 KB
 * fetch.
 *
 * This does not bypass responsive delivery. 4096px is only a ceiling on the
 * optimizer's *input*: next/image still emits the full srcSet and a card
 * still downloads its own 640px file.
 *
 * The guard matters. `large` predates this pipeline — it used to be a 1600px
 * JPEG (or PNG), which is narrower than the 1920/2048 variants the detail
 * gallery asks for, so using one as the source would quietly cap those at
 * 1600. Requiring WebP identifies derivatives produced by the current config,
 * since the old config set no `formatOptions` and so preserved the upload's
 * own format. The width clause then accepts the legitimate case where
 * `withoutEnlargement` left a small original at its own size.
 *
 * Anything that fails the guard falls back to the original, which is always
 * visually correct — only slower. That keeps media uploaded before this
 * change, and media that failed regeneration, rendering exactly as it did.
 *
 * Dimensions travel with the URL rather than being read off the original,
 * because callers pair the two: the property and project `generateMetadata`
 * routes emit them as Open Graph `image.width`/`image.height`, which have to
 * describe the file at `image.url`.
 */
export function toDeliveryImage(media: Media): {
  url: string;
  width: number | null;
  height: number | null;
} {
  const source = media.sizes?.large;
  const isCurrentPipelineOutput = source?.mimeType === 'image/webp';
  const isWideEnough =
    typeof source?.width === 'number' &&
    (source.width >= WIDEST_RENDERED_VARIANT || source.width === media.width);

  if (source?.url && isCurrentPipelineOutput && isWideEnough && typeof source.height === 'number') {
    return {
      url: toRelativeMediaUrl(source.url),
      width: source.width as number,
      height: source.height,
    };
  }

  return {
    url: toRelativeMediaUrl(media.url as string),
    width: typeof media.width === 'number' ? media.width : null,
    height: typeof media.height === 'number' ? media.height : null,
  };
}
