import type { Access, CollectionConfig } from 'payload';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

export const Amenities: CollectionConfig = {
  slug: 'amenities',

  /**
   * No access config previously meant Payload's default (deny unauthenticated
   * requests) applied, so the `amenities` relationship silently failed to
   * populate for every public request — Property and Project detail pages
   * both queried it via `overrideAccess: false`, so real visitors never saw
   * amenities. Master data, not user data: safe to read publicly.
   */
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'category'],
    description:
      'Master amenity library. Properties select from these reusable records; add new amenities here rather than duplicating them on each listing.',
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Amenity Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'category',
      type: 'select',
      label: 'Amenity Category',
      options: [
        { label: 'Building', value: 'building' },
        { label: 'Lifestyle', value: 'lifestyle' },
        { label: 'Convenience', value: 'convenience' },
      ],
    },
  ],
};
