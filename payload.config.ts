import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Amenities } from './collections/Amenities';
import { ChannelPartners } from './collections/ChannelPartners';
import { ContactInquiries } from './collections/ContactInquiries';
import { Media } from './collections/Media';
import { Projects } from './collections/Projects';
import { Properties } from './collections/Properties';
import { Users } from './collections/Users';
import { WebsiteBanners } from './collections/WebsiteBanners';
import { brochureConvertCreateHandler } from './collections/endpoints/brochureConvertCreate';
import { brochureConvertValidateHandler } from './collections/endpoints/brochureConvertValidate';
import { ensureProjectIdSequence } from './collections/hooks/assignProjectId';
import { ensurePropertyIdSequence } from './collections/hooks/assignPropertyId';
import { ensureDefaultAmenities } from './collections/hooks/ensureDefaultAmenities';
import { idSequenceSchemaHook } from './collections/hooks/idSequenceSchema';
import { SITE_URL } from './lib/siteConfig';

const dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV === 'production' && !process.env.PAYLOAD_SECRET) {
  throw new Error(
    'PAYLOAD_SECRET is not set. Refusing to start in production with the default secret.',
  );
}

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Refusing to start in production without a database.');
}

/**
 * SITE_URL falls back to http://localhost:3000, and that fallback is silent —
 * the rendered site looks completely normal while publishing localhost as its
 * own canonical URLs, sitemap entries, Open Graph URLs and JSON-LD identifiers.
 * There is no visible symptom and no error; the damage only shows up weeks
 * later in Search Console.
 *
 * Failing to boot is the lesser harm, and it matches how PAYLOAD_SECRET,
 * DATABASE_URL and the S3 variables are already handled.
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time, so setting it in the hosting
 * environment requires a redeploy before the built application picks it up.
 */
if (process.env.NODE_ENV === 'production') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is not set. Every canonical URL, sitemap entry, Open Graph tag and JSON-LD identifier is derived from it, and the fallback is http://localhost:3000 — which would be published as this site\'s own identity with no visible symptom. Set it in the hosting environment and redeploy; it is inlined at build time.',
    );
  }

  // A local `next build` legitimately runs with NODE_ENV=production against the
  // localhost value that .env.example documents, so this is a warning rather
  // than a failure. On a real deployment it is visible in the build log.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(siteUrl)) {
    console.warn(
      `[RER] NEXT_PUBLIC_SITE_URL is "${siteUrl}". A production deployment must use the public domain, or canonical URLs, the sitemap, Open Graph tags and JSON-LD will all point at localhost.`,
    );
  }
}

const requiredS3Vars = [
  'S3_BUCKET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
] as const;

if (process.env.NODE_ENV === 'production') {
  const missingS3Vars = requiredS3Vars.filter((name) => !process.env[name]);
  if (missingS3Vars.length > 0) {
    throw new Error(
      `Missing Supabase Storage (S3) configuration: ${missingS3Vars.join(', ')}. Refusing to start in production without Media file storage.`,
    );
  }
}

export default buildConfig({
  serverURL: SITE_URL,

  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      views: {
        brochureConvert: {
          Component: '/components/payload/BrochureConvertView#BrochureConvertView',
          path: '/brochure-convert',
          exact: true,
        },
        /**
         * The RER Property Management Console replaces the body of `/admin`.
         *
         * Payload's own DashboardView still wraps it (HydrateAuthProvider +
         * SetStepNav), and every other admin route, the nav rail and the
         * account menu are untouched — only the landing page's content
         * changes. This supersedes the old `afterDashboard` summary panel,
         * which the console absorbed.
         *
         * What is replaced: Payload's collection-cards widget. The console
         * ends with its own permission-filtered collection grid so nothing
         * that widget offered is lost.
         */
        dashboard: {
          Component: '/components/payload/dashboard/RerConsoleView#RerConsoleView',
        },
      },
      afterNavLinks: ['/components/payload/BrochureConvertNavLink#BrochureConvertNavLink'],
    },
  },

  collections: [
    Users,
    Properties,
    Projects,
    Amenities,
    ChannelPartners,
    Media,
    ContactInquiries,
    WebsiteBanners,
  ],

  editor: lexicalEditor({}),

  endpoints: [
    { path: '/brochure-convert/validate', method: 'post', handler: brochureConvertValidateHandler },
    { path: '/brochure-convert/create', method: 'post', handler: brochureConvertCreateHandler },
  ],

  secret: process.env.PAYLOAD_SECRET || 'dev-only-insecure-secret-do-not-use-in-production',

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Declares rer_property_id_seq / rer_project_id_seq so the dev schema push
    // keeps them instead of dropping them as unknown. See idSequenceSchema.ts.
    afterSchemaInit: [idSequenceSchemaHook],
  }),

  /**
   * Media files live in Supabase Storage via its S3-compatible endpoint —
   * Railway's own filesystem is ephemeral and is wiped on every redeploy.
   *
   * Deliberately omitted:
   * - `acl` — no ACL is set, so nothing makes the bucket/objects public.
   * - `disablePayloadAccessControl` — left false (the default), so the
   *   adapter's `staticHandler` stays registered on `upload.handlers` and
   *   requests keep streaming through this app's own
   *   `/api/media/file/:filename` route using these server-side credentials.
   *   The bucket itself is never touched directly by the browser.
   * - collection-level `prefix` — omitted so the S3 object key is exactly
   *   the filename (flat, no folder), matching the 68 files already
   *   uploaded under their existing names and every existing Media record.
   * Together this means the `url` field Payload returns for the 17 existing
   * Media records — already the relative path `/api/media/file/<filename>`
   * — is completely unaffected by adding this plugin.
   */
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        // Required by virtually every non-AWS S3-compatible provider,
        // Supabase Storage included — without it the SDK builds
        // virtual-hosted-style URLs (bucket.endpoint/…) that Supabase's
        // S3 gateway does not serve.
        forcePathStyle: true,
      },
    }),
  ],

  /**
   * Ensures PostgreSQL sequences `rer_property_id_seq` and `rer_project_id_seq`
   * exist, then seeds missing predefined amenity master records (create-only,
   * never update/delete).
   */
  onInit: async (payload) => {
    await ensurePropertyIdSequence(payload);
    await ensureProjectIdSequence(payload);
    await ensureDefaultAmenities(payload);
  },

  sharp,
});