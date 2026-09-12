import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',

  // Native Payload folders (beta, see collections/hooks/assignMediaFolder.ts).
  // Adds a hidden `folder` relationship field to every Media document,
  // pointing at a `payload-folders` doc. Properties/Projects each get
  // exactly one such folder, named after their permanent RER ID, and only
  // Media is folder-enabled, so a folder can never hold anything else.
  folders: true,

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