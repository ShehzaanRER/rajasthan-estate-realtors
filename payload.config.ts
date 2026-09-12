import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Amenities } from './collections/Amenities';
import { ContactInquiries } from './collections/ContactInquiries';
import { Media } from './collections/Media';
import { Projects } from './collections/Projects';
import { Properties } from './collections/Properties';
import { Users } from './collections/Users';
import { brochureConvertCreateHandler } from './collections/endpoints/brochureConvertCreate';
import { brochureConvertValidateHandler } from './collections/endpoints/brochureConvertValidate';
import { ensureProjectIdSequence } from './collections/hooks/assignProjectId';
import { ensurePropertyIdSequence } from './collections/hooks/assignPropertyId';
import { ensureDefaultAmenities } from './collections/hooks/ensureDefaultAmenities';
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
      },
      afterNavLinks: ['/components/payload/BrochureConvertNavLink#BrochureConvertNavLink'],
    },
  },

  collections: [Users, Properties, Projects, Amenities, Media, ContactInquiries],

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