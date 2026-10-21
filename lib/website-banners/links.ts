/**
 * The only destinations a banner call-to-action may point at:
 *
 * - a path on this site — `/properties?for=rent`, `/contact#form`
 * - an `http(s)://` address
 * - `tel:` and `mailto:` links
 *
 * Shared by the collection's `validate` (so a bad value cannot be saved) and
 * the mapper (so a value written before this rule existed, or straight into the
 * database, still cannot reach an `href`). Anything else — `javascript:`,
 * `data:`, protocol-relative `//host`, a bare word — is rejected.
 */
export function safeBannerHref(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const href = value.trim();

  if (!href || /\s/.test(href) || href.includes('\\')) {
    return null;
  }

  if (href.startsWith('/')) {
    // `//host` would leave the site.
    return href.startsWith('//') ? null : href;
  }

  if (/^tel:\+?[0-9][0-9-]{3,}$/i.test(href)) {
    return href;
  }

  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(href)) {
    return href;
  }

  try {
    const { protocol, hostname } = new URL(href);
    return (protocol === 'http:' || protocol === 'https:') && hostname ? href : null;
  } catch {
    return null;
  }
}

/** Internal paths render through next/link; everything else is a plain <a>. */
export function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function isExternalWebHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
