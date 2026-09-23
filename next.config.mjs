import { withPayload } from '@payloadcms/next/withPayload';

// Payload's `serverURL` config makes it emit fully-qualified media URLs
// (e.g. https://rajasthanestaterealtors.in/api/media/file/x.jpg) rather than
// relative paths. next/image treats an absolute URL as "remote" even when it
// points back at this same app, so the site's own origin must be allow-listed
// here. Derived from NEXT_PUBLIC_SITE_URL so this tracks dev/production
// automatically instead of hardcoding a host.
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

/**
 * Next 16 streams metadata by default: `<title>`, the canonical link and the
 * description are flushed *after* `</head>` unless the requesting user agent
 * matches its built-in `HTML_LIMITED_BOT_UA_RE`, in which case it falls back to
 * a blocking render (see next/dist/server/lib/streaming-metadata.js).
 *
 * Googlebot is unaffected either way — it renders with headless Chrome, where
 * React hoists those tags into `<head>` — and Bingbot is already in Next's
 * list. Everything else is not: SEO crawlers reported RER's titles and
 * canonicals as "outside <head>", and the AI search crawlers, which largely do
 * not execute JavaScript, were reading the site with no title and no canonical
 * at all.
 *
 * This is Next's own default pattern, copied verbatim from
 * next/dist/shared/lib/router/utils/html-bots.js at v16.3.2, extended with the
 * agents it does not know about. Copied rather than imported because it lives
 * in Next's internals; re-check it on a major Next upgrade. Note that the
 * JSDoc default printed in Next's own `config-shared.d.ts` is stale and shorter
 * than the runtime value — html-bots.js is the one to copy from.
 *
 * Widening the list costs a blocking render for the listed agents only. No
 * human visitor and no browser is affected.
 */
const NEXT_DEFAULT_HTML_LIMITED_BOTS =
  '[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|' +
  'bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|' +
  'facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|' +
  'SkypeUriPreview|Yeti|googleweblight';

const ADDITIONAL_HTML_LIMITED_BOTS =
  // SEO crawlers — these are what reported metadata "outside <head>".
  'Screaming Frog|AhrefsBot|SemrushBot|Sitebulb|rogerbot|dotbot|MJ12bot|BLEXBot|' +
  // AI search crawlers — mostly no JavaScript execution, so streamed metadata
  // never reaches them.
  'GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|ClaudeBot|Claude-Web|Claude-SearchBot|' +
  'Amazonbot|Bytespider|CCBot|Applebot-Extended|Google-Extended|meta-externalagent|' +
  // Additional preview/unfurl agents not in Next's list.
  'TelegramBot|Pinterestbot|redditbot-preview|Mastodon';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Transport and content-type hardening.
 *
 * Railway terminates TLS at its edge and already answers plain HTTP with a
 * redirect to HTTPS, so an application-level http->https redirect is not added
 * here: behind a terminating proxy the app only ever sees the decrypted
 * request, and a redirect written against `x-forwarded-proto` is the classic
 * way to produce a loop when that header is absent or rewritten.
 *
 * What the platform does *not* send is HSTS, and that is the part that
 * matters. Without it, the very first request a visitor makes — typing the
 * bare domain, or following an old `http://` link — travels in clear text
 * before the redirect answers, which is exactly the request an attacker on a
 * hostile network intercepts. HSTS removes that first hop by making the
 * browser rewrite the scheme itself.
 *
 * Two years, with subdomains. `preload` is deliberately omitted: submitting to
 * the preload list is effectively irreversible on browser timelines, and that
 * is the site owner's decision to make, not a default to inherit.
 *
 * Production only. On localhost the site is served over plain HTTP, and
 * although browsers ignore HSTS from an insecure origin, emitting it there is
 * still misleading in a `curl -I`.
 */
const securityHeaders = [
  // Stops a browser second-guessing a declared Content-Type. The relevant
  // surface here is `/api/media/file/:filename`, which streams visitor-
  // uploadable bytes from the CMS.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Send the full URL to same-origin destinations, origin only on cross-origin
  // HTTPS, nothing on a downgrade. This is the browser default in current
  // Chrome and Firefox; stating it explicitly stops an older browser falling
  // back to leaking full listing URLs to WhatsApp and Google Maps.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // SAMEORIGIN rather than DENY: Payload's admin panel frames its own routes
  // (live preview), and DENY would break that. The public site is never framed.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains',
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  // Suppresses `X-Powered-By: Next.js`. Version-free, but it still names the
  // stack for free on every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  htmlLimitedBots: new RegExp(
    `${NEXT_DEFAULT_HTML_LIMITED_BOTS}|${ADDITIONAL_HTML_LIMITED_BOTS}`,
    'i',
  ),
  images: {
    remotePatterns: [
      {
        protocol: siteUrl.protocol.replace(':', ''),
        hostname: siteUrl.hostname,
        port: siteUrl.port || '',
        pathname: '/api/media/**',
      },
    ],
    /**
     * WebP only — deliberately NOT AVIF.
     *
     * Next.js rescales the `quality` prop before handing it to the AVIF
     * encoder (`quality * 50 / 80`, see next/dist/server/image-optimizer.js),
     * so `quality={85}` actually encodes at AVIF q53 and `quality={70}` at
     * q44. Measured against an unencoded lanczos downscale of a real 8064px
     * property photo, that retained only 69-79% of the image's detail energy
     * and visibly waxed over marble veining, wall grain and foliage. The
     * ceiling is hard: even `quality={100}` only reaches AVIF q63.
     *
     * WebP takes the quality prop verbatim and retains 92-98% at the same
     * widths for roughly +45KB on a full-width detail image. For property
     * photography that trade is worth it — the brief is quality per byte,
     * not fewest bytes.
     */
    formats: ['image/webp'],
    /**
     * Next.js 16 requires an explicit allowlist for the `quality` prop, and
     * rejects anything outside it with HTTP 400 rather than clamping.
     * 75 is here because it is next/image's own default for any <Image>
     * that omits the prop.
     *
     * 82 = cards, listing tiles, gallery thumbnails
     * 85 = detail heroes, gallery main images, floor plans, standalone photos
     * 88 = full-bleed / lightbox, where the image is the content
     */
    qualities: [75, 82, 85, 88],
    /**
     * 7 days, up from the 4-hour default.
     *
     * Not the 31 days that immutable media would justify: these URLs are
     * filename-addressed, not content-addressed. Re-uploading a photo or
     * re-running scripts/regenerate-media-sizes.ts reuses the same filename,
     * and a derivative's name is derived from its dimensions
     * (`<name>-2400x1800.webp`), so the same URL can legitimately serve new
     * bytes. Next sends `max-age=<ttl>, must-revalidate`, so this is also the
     * window in which a browser will keep showing a replaced photo without
     * checking back. A week captures effectively all of the cache benefit
     * while keeping that worst case recoverable.
     */
    minimumCacheTTL: 604800,
  },
};

export default withPayload(nextConfig);
