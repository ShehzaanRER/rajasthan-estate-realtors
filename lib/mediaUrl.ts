import { SITE_URL } from './siteConfig';

/**
 * Payload's `serverURL` config (needed for the admin panel/API) makes it emit
 * fully-qualified media URLs. Converting back to a relative path here means
 * next/image and the browser fetch these from this same app directly,
 * instead of the server making a self-referential external HTTP request to
 * its own public domain to optimize its own images.
 *
 * Mirrors the equivalent helper inlined in lib/properties/mapProperty.ts.
 * Kept here as a shared export so lib/projects/mapProject.ts (and any
 * future mapper) can reuse it without duplicating the logic; the property
 * mapper's own copy is left untouched since it's part of the already
 * committed image-optimization work.
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
