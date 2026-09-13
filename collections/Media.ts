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
    group: 'Media Library',
    useAsTitle: 'alt',
  },

  upload: {
    mimeTypes: ['image/*'],
    displayPreview: true,

    /**
     * Three derivatives, every one of them cut directly from the original
     * upload — never from each other. Payload clones a single `sharp` instance
     * built from the original buffer once per size
     * (uploads/image-resizing/createImageSizes.js), so there is no derivative
     * chain here and the original file is never rewritten.
     *
     * `large` is the one the public website actually serves, via
     * toDeliveryImage() in lib/mediaUrl.ts. Originals here run to 8064x6048 /
     * 28 MB, and next/image was being handed that 48-megapixel file directly:
     * it has to fetch and fully decode its input before it can resize, so
     * every generated width cost a full download from Supabase Storage plus a
     * 48 MP decode — measured at 2.7-6.5s per cold variant. Capping the
     * optimizer's input at 2400px WebP q90 turns that into a 136-461 KB fetch.
     *
     * 2400 is chosen to sit above the widest variant any layout actually
     * requests (2048), so next/image still does all the responsive
     * downscaling from it and a card still receives its own 640px file. It is
     * an upper bound on the optimizer's *input*, not the output.
     *
     * `thumbnail` exists for the Payload admin. The media library picks the
     * smallest size at least 40px wide (utilities/getBestFitFromSizes.js);
     * with no small size it falls back to the original, which would mean the
     * admin grid pulling multi-megabyte files one per row.
     *
     * `card` is not read by anything today. It is kept because these three
     * names map 1:1 onto the `sizes_thumbnail_* / sizes_card_* / sizes_large_*`
     * columns that already exist on the media table, so redefining them
     * changes no schema: this repo has no migrations directory and shares one
     * database with production, where Payload's dev schema push does not run.
     * Dropping `card` would mean a migration for no user-visible gain.
     *
     * Notes on the options, which are easy to get wrong:
     * - `fit: 'inside'` makes getImageResizeAction return a plain 'resize'
     *   rather than 'resizeWithFocalPoint'. The focal-point path re-resizes
     *   without `withoutEnlargement` before extracting, which would upscale a
     *   sub-2400px original on any document that has a focal point set.
     * - `withoutEnlargement: true` keeps smaller originals at their own size
     *   instead of omitting the size entirely (the default for a width-only
     *   config), so every document ends up with a bounded WebP source. That
     *   matters most for PNG uploads, where format conversion is the whole
     *   win: 09-amenities.png is a 3.6 MB PNG and becomes a 381 KB source.
     * - No height on any size, so property photography is never server-side
     *   cropped. Framing stays exactly as uploaded.
     */
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'large',
        width: 2400,
        fit: 'inside',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 90 } },
      },
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