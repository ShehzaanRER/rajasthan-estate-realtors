import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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