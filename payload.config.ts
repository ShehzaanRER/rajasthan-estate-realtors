import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import { Users } from './collections/Users';

export default buildConfig({
  admin: {
    user: 'users',
  },

  collections: [Users],

  editor: lexicalEditor({}),

  secret: process.env.PAYLOAD_SECRET || 'change-this-to-a-secure-secret',

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
});