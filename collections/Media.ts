import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: () => true,
  },

  admin: {
    useAsTitle: 'alt',
  },

  upload: {
    mimeTypes: ['image/*'],
    displayPreview: true,
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
    },
  ],
};