import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Amenities } from './collections/Amenities';
import { Media } from './collections/Media';
import { Properties } from './collections/Properties';
import { Users } from './collections/Users';
import { ensurePropertyIdSequence } from './collections/hooks/assignPropertyId';
import { ensureDefaultAmenities } from './collections/hooks/ensureDefaultAmenities';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [Users, Properties, Amenities, Media],

  editor: lexicalEditor({}),

  secret: process.env.PAYLOAD_SECRET || 'change-this-to-a-secure-secret',

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),

  /**
   * Ensures PostgreSQL sequence `rer_property_id_seq` exists, then seeds
   * missing predefined amenity master records (create-only, never update/delete).
   */
  onInit: async (payload) => {
    await ensurePropertyIdSequence(payload);
    await ensureDefaultAmenities(payload);
  },

  sharp,
});