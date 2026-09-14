import type { Access, CollectionConfig } from 'payload';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * The developer logos shown in the "Official Channel Partners for" marquee
 * below the homepage legacy section.
 *
 * Deliberately a flat list rather than a partner CRM: the website only needs
 * a name, a logo, an optional link and an order. Anything richer (contacts,
 * agreements, per-project mapping) belongs somewhere else if it is ever
 * needed — this collection exists so partners can be added, reordered and
 * retired without a code change.
 */
export const ChannelPartners: CollectionConfig = {
  slug: 'channel-partners',

  /**
   * Read is public because the homepage queries it with `overrideAccess:
   * false`, the same as Amenities. Everything else is staff-only.
   */
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  admin: {
    group: 'Reference Data',
    useAsTitle: 'name',
    defaultColumns: ['name', 'displayOrder', 'active'],
    description:
      'RER developer inventory. Every developer RER tracks lives here; only those with Show on Website ticked appear in the "Official Channel Partners for" strip on the homepage, ordered by Display Order.',
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Partner Name',
      admin: {
        description: 'Used as the logo alt text and the link label.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
      admin: {
        description:
          'Upload the highest-quality source available — SVG first, otherwise a high-resolution PNG/WebP with a transparent background. Logos are shown contained, so the original aspect ratio is preserved. Optional, because this collection also holds developers kept for internal reference only — but a partner with no logo cannot be shown on the website, so Show on Website has no effect until one is added.',
      },
    },
    {
      name: 'websiteUrl',
      type: 'text',
      label: 'Website URL',
      admin: {
        description: 'Optional. When set, the logo card links out to this address in a new tab.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) {
          return true;
        }

        try {
          const { protocol } = new URL(value);
          return protocol === 'http:' || protocol === 'https:'
            ? true
            : 'Enter a full http:// or https:// address.';
        } catch {
          return 'Enter a full http:// or https:// address, e.g. https://example.com';
        }
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      label: 'Display Order',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first. Ties fall back to alphabetical order.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Show on Website',
      defaultValue: true,
      admin: {
        description:
          'Controls public visibility only. Unchecked keeps the developer in this internal inventory without showing it in the Official Channel Partners section; checked publishes it immediately, in Display Order. No code change is needed either way.',
      },
    },
  ],
};
