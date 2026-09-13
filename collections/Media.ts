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
     * optimizer's input at 4096px WebP q90 makes that a ~380 KB fetch and
     * drops cold variant generation to roughly a fifth of the time.
     *
     * On the width, measured across the three real 8064x6048 photos in the
     * library at the six widths the site actually requests (mean retained
     * detail energy against a direct one-step downscale of the original):
     *
     *              640    828   1080   1200   1920   2048    mean
     *   originals   94%    95%    94%    95%    91%    91%   93.2%
     *   2400px      96%    97%    82%    97%    63%    61%   79.7%
     *   4096px      98%   104%    85%    86%    72%    88%   88.9%
     *
     * 2400 looks adequate until the gallery widths: 2400 -> 1920 is only a
     * 1.25x downscale off an already-compressed intermediate, which is close
     * to a plain re-encode and collapses to ~62% — worse than the AVIF
     * settings this whole change set out to fix. 4096 keeps a real downscale
     * ratio at every width the site renders.
     *
     * The residual ~4 point gap against feeding originals directly is the
     * intrinsic cost of resampling twice, not of compression: at 4096 the
     * mean is 88.9% at q90, 89.3% at q98 and 89.6% near-lossless (7 MB), so
     * no amount of intermediate quality buys it back. 4.3 points of detail
     * for a ~70x smaller source is the trade being made here deliberately.
     *
     * Sharpening after the downscale was evaluated and rejected. On photos it
     * worked well (a sigma 0.6 / m1 0.4 / m2 0.7 unsharp mask lifted a 2400px
     * source from 79.7% to 93.4% with halo overshoot on only 0.17% of edge
     * pixels against 0.02% for the baseline). But `imageSizes` cannot apply it
     * conditionally, and originals narrower than the bound are never
     * downscaled at all, so the sharpen lands on them at full strength: on
     * 09-amenities.png — a 1787px graphic, not a photograph — it haloed 6.62%
     * of edge pixels, as bad as a deliberately over-sharpened profile. Uploads
     * here include floor plans, master plans and location maps, so a filter
     * that is only safe for photographs is not safe for this collection.
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
        width: 4096,
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