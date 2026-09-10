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
    // AVIF preferred, WebP fallback.
    formats: ['image/avif', 'image/webp'],
    // 70 = listing/gallery-thumbnail contexts, 85 = hero/detail-gallery context.
    // Next.js 16 requires an explicit allowlist for the `quality` prop.
    qualities: [70, 85],
  },
};

export default withPayload(nextConfig);