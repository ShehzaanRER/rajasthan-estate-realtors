import type { CollectionConfig } from 'payload';

export const Amenities: CollectionConfig = {
  slug: 'amenities',

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
