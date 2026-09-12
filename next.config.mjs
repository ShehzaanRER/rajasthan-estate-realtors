import { withPayload } from '@payloadcms/next/withPayload';

// Payload's `serverURL` config makes it emit fully-qualified media URLs
// (e.g. https://rajasthanestaterealtors.in/api/media/file/x.jpg) rather than
// relative paths. next/image treats an absolute URL as "remote" even when it
// points back at this same app, so the site's own origin must be allow-listed
// here. Derived from NEXT_PUBLIC_SITE_URL so this tracks dev/production
// automatically instead of hardcoding a host.
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
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
