import { ValidationError } from 'payload';
import type {
  Access,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Condition,
  FieldAccess,
  Validate,
} from 'payload';
import { safeBannerHref } from '../lib/website-banners/links';
import {
  BANNER_ALIGNMENTS,
  BANNER_OVERLAYS,
  BANNER_PLACEMENTS,
  BANNER_POSITIONS,
  placementKind,
  placementPath,
  type BannerKind,
} from '../lib/website-banners/placements';
import { SITE_URL } from '../lib/siteConfig';
import {
  revalidateBannerAfterChange,
  revalidateBannerAfterDelete,
} from './hooks/revalidateWebsiteBanner';

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * Staff read everything, drafts included — the admin needs them. Anyone else
 * reads only what is published *and* switched on, enforced here as a query
 * constraint so it holds for the REST and GraphQL APIs as well as for the
 * website's own `overrideAccess: false` Local API reads.
 */
export const readPublishedEnabledBanners: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    and: [{ _status: { equals: 'published' } }, { enabled: { equals: true } }],
  };
};

const signedInOnly: FieldAccess = ({ req: { user } }) => Boolean(user);

/**
 * The placement is the banner's stable key — it is what the website matches
 * on. Once a record has one it is locked, so a live banner cannot be moved to
 * another page by an accidental edit. To move one, delete it and create the
 * other placement's record.
 */
export const placementUpdateAccess: FieldAccess = ({ doc }) => !doc?.placement;

function kindOf(data: Record<string, unknown> | undefined): BannerKind | null {
  return placementKind(data?.placement);
}

function hasTextFields(data: Record<string, unknown> | undefined): boolean {
  const kind = kindOf(data);
  return kind === 'hero' || kind === 'page';
}

const usesText: Condition = (data) => hasTextFields(data);

const usesCta: Condition = (data) => hasTextFields(data) && Boolean(data?.showCta);

const usesAlignment: Condition = (data) => kindOf(data) === 'page';

const usesAltText: Condition = (data) => kindOf(data) === 'image';

/** The hero and the Our Story image have no design without a photograph. */
function requiresImage(data: Record<string, unknown> | undefined): boolean {
  const kind = kindOf(data);
  return kind === 'hero' || kind === 'image';
}

const validateDesktopImage: Validate = (value, { data }) => {
  if (!value && requiresImage(data as Record<string, unknown>)) {
    return 'This placement needs a desktop image before it can be published.';
  }

  return true;
};

const validateHeading: Validate = (value, { data }) => {
  if (hasTextFields(data as Record<string, unknown>) && (typeof value !== 'string' || !value.trim())) {
    return 'A heading is required for this placement.';
  }

  return true;
};

const validateCtaLabel: Validate = (value, { siblingData }) => {
  const sibling = siblingData as Record<string, unknown>;

  if (sibling?.showCta && (typeof value !== 'string' || !value.trim())) {
    return 'Enter the button text, or untick "Show button".';
  }

  return true;
};

const validateCtaUrl: Validate = (value, { siblingData }) => {
  const sibling = siblingData as Record<string, unknown>;

  if (!value) {
    return sibling?.showCta ? 'Enter where the button links to, or untick "Show button".' : true;
  }

  return safeBannerHref(value)
    ? true
    : 'Use a site path such as /properties?for=rent, a full https:// address, or a tel: / mailto: link.';
};

/**
 * Drafts skip field validation, which is what lets an administrator save an
 * unfinished banner. The one thing a draft still may not omit is its
 * placement: a record without one can never be shown, and could not be given
 * one later through the locked field. Enforced here rather than with
 * `required`, which a draft save does not check.
 */
const requirePlacement: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  if (!data?.placement && !originalDoc?.placement) {
    throw new ValidationError({
      collection: 'website-banners',
      errors: [{ path: 'placement', message: 'Choose where this banner appears.' }],
      req,
    });
  }

  return data;
};

/** Raster photographs only — an SVG has no derivatives for next/image to use. */
const rasterImagesOnly = () => ({ mimeType: { not_equals: 'image/svg+xml' } });

const positionOptions = BANNER_POSITIONS.map(({ value, label }) => ({ value, label }));

/**
 * Website Banners — the photography and copy of the public site's page
 * headers, the homepage hero and the homepage Our Story image.
 *
 * One record per placement (enforced by a unique index on `placement`), so the
 * website never has to choose between competing records. Changes are prepared
 * as drafts and reach the site only when published; `enabled` is a separate,
 * published switch that takes a banner off the site without deleting it.
 *
 * Images are relationships to the shared Media collection, delivered through
 * the same `large` derivative and next/image pipeline as property photography.
 */
export const WebsiteBanners: CollectionConfig = {
  slug: 'website-banners',

  labels: {
    singular: 'Website Banner',
    plural: 'Website Banners',
  },

  access: {
    read: readPublishedEnabledBanners,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
    readVersions: isAuthenticated,
  },

  versions: {
    drafts: true,
    maxPerDoc: 25,
  },

  // A duplicate would collide with the original's unique placement.
  disableDuplicate: true,

  admin: {
    group: 'Website',
    useAsTitle: 'name',
    defaultColumns: ['name', 'placement', 'enabled', '_status', 'updatedAt'],
    listSearchableFields: ['name', 'placement'],
    description:
      'Photography and text for the homepage hero, the homepage Our Story image and the Properties, Projects, About and Contact page headers. One banner per placement. Save Draft to prepare a change; only Publish puts it on the website. A placement with no published, enabled banner keeps the site’s built-in design.',
    // Opens the page this banner appears on. It shows the published banner,
    // not an unsaved draft.
    preview: (doc) => {
      const path = placementPath(doc?.placement);
      return path ? `${SITE_URL}${path}` : null;
    },
  },

  hooks: {
    beforeChange: [requirePlacement],
    afterChange: [revalidateBannerAfterChange],
    afterDelete: [revalidateBannerAfterDelete],
  },

  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Banner Name',
          required: true,
          admin: {
            width: '50%',
            description: 'Internal only — how this banner is listed in the admin.',
          },
        },
        {
          name: 'placement',
          type: 'select',
          label: 'Placement',
          required: true,
          unique: true,
          index: true,
          options: BANNER_PLACEMENTS.map(({ value, label }) => ({ value, label })),
          access: {
            update: placementUpdateAccess,
          },
          admin: {
            width: '50%',
            description:
              'Where on the website this banner appears. Each placement can have only one banner, and it cannot be changed once saved.',
          },
        },
      ],
    },

    {
      type: 'tabs',
      tabs: [
        {
          label: 'Images',
          description:
            'Choose an existing image from the Media library or upload a new one. To replace a photograph, pick a different image here and publish.',
          fields: [
            {
              name: 'desktopImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Desktop Image',
              filterOptions: rasterImagesOnly,
              validate: validateDesktopImage,
              admin: {
                description:
                  'Used on every screen size unless a mobile image is added. Landscape, at least 2400px wide (see docs/BANNER-ASSETS.md for each placement’s size). Required for the homepage hero and the Our Story image; optional for page headers, which show the plain navy design without one.',
              },
            },
            {
              name: 'mobileImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Mobile Image (optional)',
              filterOptions: rasterImagesOnly,
              admin: {
                description:
                  'A portrait crop shown below 768px wide. Only needed when the desktop photograph loses its subject on a phone — otherwise the Mobile Focal Position below is enough.',
              },
            },
            {
              name: 'imageAlt',
              type: 'text',
              label: 'Image Description (alt text)',
              admin: {
                condition: usesAltText,
                description:
                  'What the photograph shows, for screen readers and search engines. Leave blank to use the Media record’s own description.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'desktopPosition',
                  type: 'select',
                  label: 'Focal Position',
                  defaultValue: 'center',
                  options: positionOptions,
                  admin: {
                    width: '50%',
                    description:
                      'Which part of the photograph stays in frame when the banner crops it.',
                  },
                },
                {
                  name: 'mobilePosition',
                  type: 'select',
                  label: 'Mobile Focal Position',
                  options: positionOptions,
                  admin: {
                    width: '50%',
                    description: 'Optional. Leave blank to use the Focal Position on phones too.',
                  },
                },
              ],
            },
          ],
        },

        {
          label: 'Content',
          description:
            'Plain text only. Not used by the Our Story image, whose section has its own text.',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow',
              admin: {
                condition: usesText,
                description: 'Optional small gold label above the heading, e.g. “Get In Touch”.',
              },
            },
            {
              name: 'heading',
              type: 'text',
              label: 'Heading',
              validate: validateHeading,
              admin: {
                condition: usesText,
                description: 'The first, white line of the page heading.',
              },
            },
            {
              name: 'headingAccent',
              type: 'text',
              label: 'Heading — Gold Line',
              admin: {
                condition: usesText,
                description: 'Optional second line, shown in gold italics beneath the heading.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
              admin: {
                condition: usesText,
                description: 'Optional supporting paragraph. One or two sentences reads best.',
              },
            },
            {
              name: 'showCta',
              type: 'checkbox',
              label: 'Show button',
              defaultValue: false,
              admin: {
                condition: usesText,
                description:
                  'On the homepage hero this is the gold “Explore Properties” button; the “Speak With Us” phone button is always shown.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ctaLabel',
                  type: 'text',
                  label: 'Button Text',
                  validate: validateCtaLabel,
                  admin: {
                    width: '50%',
                    condition: usesCta,
                  },
                },
                {
                  name: 'ctaUrl',
                  type: 'text',
                  label: 'Button Link',
                  validate: validateCtaUrl,
                  admin: {
                    width: '50%',
                    condition: usesCta,
                    description:
                      'A site path such as /properties?for=rent, a full https:// address, or a tel: / mailto: link.',
                  },
                },
              ],
            },
          ],
        },

        {
          label: 'Layout',
          description: 'Not used by the Our Story image.',
          fields: [
            {
              name: 'overlay',
              type: 'select',
              label: 'Overlay Strength',
              defaultValue: 'standard',
              options: BANNER_OVERLAYS.map(({ value, label }) => ({ value, label })),
              admin: {
                condition: usesText,
                description:
                  'The navy tint over the photograph that keeps the text readable. Check the result on a phone before choosing Light.',
              },
            },
            {
              name: 'textAlign',
              type: 'select',
              label: 'Text Alignment',
              defaultValue: 'left',
              options: BANNER_ALIGNMENTS.map(({ value, label }) => ({ value, label })),
              admin: {
                condition: usesAlignment,
                description:
                  'Left keeps the photograph visible on the right on wide screens. Centred uses an even overlay across the whole image.',
              },
            },
          ],
        },
      ],
    },

    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show on Website',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Untick and publish to take this banner off the website without deleting it; the page falls back to its built-in design. Takes effect when published.',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Internal Notes',
      access: {
        read: signedInOnly,
        create: signedInOnly,
        update: signedInOnly,
      },
      admin: {
        position: 'sidebar',
        description: 'Staff only — never shown on the website or returned by the public API.',
      },
    },
  ],
};
