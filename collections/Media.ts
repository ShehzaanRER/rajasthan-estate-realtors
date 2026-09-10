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
    // Bounds how large a source file Next.js's image optimizer ever has to
    // fetch from Payload's storage. Width-only (no height) so property
    // photos are never server-side cropped — framing stays intact, and
    // next/image's own responsive delivery handles final sizing/format.
    imageSizes: [
      { name: 'thumbnail', width: 480 },
      { name: 'card', width: 800 },
      { name: 'large', width: 1600 },
    ],
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