import { SITE_URL } from '../siteConfig';

/**
 * The branded fallback social card: the RER house mark and wordmark on the
 * navy, 1200x630. Used wherever a page has no photograph of its own — the
 * homepage, /about, /contact, the two listing pages, the legal pages, and any
 * property or project whose record carries no image yet.
 *
 * Why this is a plain file under `public/` and an explicit `images` entry,
 * rather than Next's `opengraph-image.png` file convention:
 *
 * The file convention only reaches pages that do **not** declare an
 * `openGraph` object of their own. Next replaces that object wholesale rather
 * than merging into it, so /about, /contact, /properties and /projects — all
 * of which set their own `openGraph` title, description and url — silently
 * dropped the inherited image and shared with no preview at all. Naming the
 * image explicitly is the version that cannot fail quietly.
 *
 * The URL is absolute. `metadataBase` would resolve a relative one for
 * `og:image` specifically, but several crawlers do not honour it, and
 * everything else in this codebase that emits a social or JSON-LD URL is
 * already absolute.
 */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og-default.png`,
  width: 1200,
  height: 630,
  alt: "Rajasthan Estate Realtors — real estate across Mumbai's Western Suburbs, established 1988.",
} as const;
