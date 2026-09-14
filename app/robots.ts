import type { MetadataRoute } from 'next';
import { SITE_URL } from '../lib/siteConfig';

/**
 * The disallow list is enumerated rather than written as a broad `/api` prefix.
 *
 * Every image on the site — property photographs, floor plans, partner logos —
 * streams from `/api/media/file/:filename` (see the storage notes in
 * `payload.config.ts`), and that path is also what `generateMetadata` publishes
 * as `og:image`. A blanket `Disallow: /api` therefore told Google, and every
 * social preview crawler that honours robots.txt, not to fetch the site's own
 * photographs. Shared listings rendered with no image at all.
 *
 * Expressing the exception as `Allow: /api/media/file/` would depend on
 * longest-match precedence, which Google and Bing implement but the simpler
 * social crawlers do not reliably. Naming the disallowed paths avoids relying
 * on that behaviour at all.
 *
 * The cost is maintenance: this list must be updated when a collection or a
 * custom endpoint is added. `payload.config.ts` is the source of truth for what
 * exists under `/api`.
 *
 * None of this is access control. `/api/users` and the brochure-convert
 * endpoints are protected by Payload access control and `req.user` checks;
 * robots.txt only steers well-behaved crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',

        // Payload auth and schema surfaces.
        '/api/users',
        '/api/graphql',
        '/api/graphql-playground',

        // Admin-only custom endpoints.
        '/api/brochure-convert',

        // Form submission target and the records it writes.
        '/api/contact',
        '/api/contact-inquiries',

        // REST duplicates of content that already has real pages. Blocked to
        // avoid spending crawl budget on JSON copies of the listings.
        '/api/properties',
        '/api/projects',
        '/api/amenities',
        '/api/channel-partners',

        // Deliberately NOT '/api/media' — that prefix would also match
        // '/api/media/file/...', which is every image on the site. Only the
        // JSON listing endpoint is excluded, via its query string.
        '/api/media?',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
