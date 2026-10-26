import type { Access, CollectionConfig } from 'payload';
import { PUBLIC_LISTING_STATUSES } from '../lib/listings/vocabulary';
import { assignListingId } from './hooks/assignListingId';
import { assignListingSlug } from './hooks/assignListingSlug';
import { explainDuplicateListingError } from './hooks/listingErrors';
import { lockPropertyListings } from './hooks/listingLock';
import { syncRollupAfterListingChange, syncRollupAfterListingDelete } from './hooks/syncPropertyRollup';
import { ALLOW_LEGACY_SLUG, validateListing } from './hooks/validateListing';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * Same reserved words as Properties: slugs the site's own routing needs.
 * Listings share the `/properties/<slug>` URL space with nothing else, but a
 * slug of `in` would still shadow the planned locality landing pages.
 */
const RESERVED_LISTING_SLUGS = new Set(['in', 'all', 'new', 'page', 'search', 'properties', 'projects']);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSAFE_SLUG_PATTERN = /[\s/?#%\\]/;

const readPublicOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    status: {
      in: [...PUBLIC_LISTING_STATUSES],
    },
  };
};

const staffOnly = { read: ({ req: { user } }: { req: { user?: unknown } }) => Boolean(user) };

const onlyFor = (...types: string[]) => (data: Record<string, unknown> | undefined) =>
  types.includes(String(data?.transactionType ?? ''));

/**
 * One transaction (sale, rent or lease) offered on a physical Property.
 *
 * A Listing owns everything that can differ between two transactions on the
 * same unit: its price and terms, its status, its public URL, its marketing
 * tags and its assigned agent. Everything that describes the unit itself —
 * address, specifications, photographs, amenities, owner, tenancy history —
 * lives once on the parent Property and is read through `property`.
 *
 * Business rules (`validateListing`) are enforced on the server, not in the
 * form: the parent exists, a listing is never re-parented, the status fits the
 * transaction type, a live listing has an amount, and a property has at most
 * one active listing per transaction type. Deleting a listing never touches its
 * property or the property's other listings; `syncRollupAfterListing*` then
 * refreshes the property's summary status.
 */
export const Listings: CollectionConfig = {
  slug: 'listings',

  labels: { singular: 'Listing', plural: 'Listings' },

  // A copy would be a second active listing of the same type — exactly what the
  // duplicate rule exists to stop. Add a listing from the property instead.
  disableDuplicate: true,

  admin: {
    group: 'Listings',
    useAsTitle: 'listingId',
    defaultColumns: ['listingId', 'property', 'transactionType', 'pricing', 'status', 'updatedAt'],
    listSearchableFields: ['listingId', 'slug'],
    description:
      'One sale, rental or lease offered on a property. The property holds the address, specifications and photographs; each listing holds its own price, terms and status.',
  },

  defaultSort: '-updatedAt',

  access: {
    read: readPublicOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  hooks: {
    // Order matters: the slug hook needs the property, validation needs the
    // slug-independent merged data. All three run before field validation.
    // lockPropertyListings first: it serialises concurrent saves for one property
    // before the slug and duplicate checks read its other listings.
    beforeChange: [lockPropertyListings, assignListingId, assignListingSlug, validateListing],
    afterChange: [syncRollupAfterListingChange],
    afterDelete: [syncRollupAfterListingDelete],
    // The partial unique index (listingIndexSchema.ts) is the race-proof backstop
    // for the duplicate rule; this turns its generic error into an explanation.
    afterError: [explainDuplicateListingError],
  },

  fields: [
    // ==========================================================
    // SIDEBAR — identity and status, always visible.
    // ==========================================================
    {
      name: 'listingId',
      type: 'text',
      label: 'Listing ID',
      unique: true,
      access: {
        update: () => false,
      },
      // See the identical note on Properties.propertyId: a duplicate re-runs
      // assignListingId, this just keeps its transient copy from looking real.
      hooks: {
        beforeDuplicate: [() => null],
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'Identifies this transaction only (RER-L-…). The property keeps its own permanent Property ID (RER-…).',
      },
    },
    {
      name: 'listingProperty',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/payload/ListingPropertySummary#ListingPropertySummary',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Draft or Withdrawn = not on the website. Available / Under offer = live. Sold / Rented closes this listing only.',
        components: {
          Cell: '/components/payload/StatusBadge#StatusBadge',
        },
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Available', value: 'available' },
        { label: 'Under offer', value: 'under-offer' },
        { label: 'Sold', value: 'sold' },
        { label: 'Rented', value: 'rented' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
    },

    // ==========================================================
    // MAIN AREA
    // ==========================================================
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Listing',
          fields: [
            {
              name: 'property',
              type: 'relationship',
              relationTo: 'properties',
              hasMany: false,
              required: true,
              index: true,
              label: 'Property',
              admin: {
                description:
                  'The physical property this listing is for. Fixed once the listing is saved. Add listings from the property\'s Listings tab to skip this step.',
              },
            },
            {
              name: 'transactionType',
              type: 'select',
              required: true,
              index: true,
              label: 'Transaction type',
              options: [
                { label: 'Sale', value: 'sale' },
                { label: 'Rent', value: 'rent' },
                { label: 'Lease', value: 'lease' },
              ],
              admin: {
                description:
                  'A property can have one active Sale, one active Rent and one active Lease listing at the same time.',
              },
            },
            {
              name: 'slug',
              type: 'text',
              // Required so the column is NOT NULL; the custom validate lets it
              // be blank on create, where assignListingSlug fills it.
              required: true,
              unique: true,
              hooks: {
                beforeDuplicate: [() => null],
              },
              admin: {
                description:
                  'Generated on create. The first listing of a property uses the property\'s own slug, so existing links keep working; later listings add -sale / -rent / -lease. This is the public URL — it is never rewritten by later edits.',
              },
              validate: (
                value: unknown,
                { operation, req }: { operation?: string; req?: { context?: Record<string, unknown> } },
              ) => {
                if (typeof value !== 'string' || !value.trim()) {
                  return operation === 'create' ? true : 'A slug is required.';
                }

                const slug = value.trim();

                if (operation === 'create' && req?.context?.[ALLOW_LEGACY_SLUG] !== true) {
                  if (!SLUG_PATTERN.test(slug)) {
                    return 'Use lowercase letters, numbers and single hyphens only.';
                  }

                  if (RESERVED_LISTING_SLUGS.has(slug)) {
                    return `"${slug}" is reserved for site navigation. Please choose a different slug.`;
                  }

                  return true;
                }

                // Migrated listings inherit legacy property slugs ("Andheri"),
                // so the strict shape is not enforced on update — only
                // characters that would genuinely break the URL.
                if (UNSAFE_SLUG_PATTERN.test(slug)) {
                  return 'A slug cannot contain spaces, slashes or other URL-reserved characters.';
                }

                return true;
              },
            },
            {
              name: 'tags',
              type: 'select',
              hasMany: true,
              label: 'Listing tags',
              options: [
                { label: 'Featured', value: 'featured' },
                { label: 'New', value: 'new' },
                { label: 'Premium', value: 'premium' },
                { label: 'Price reduced', value: 'price-reduced' },
              ],
              admin: {
                description:
                  'Marketing tags for this listing only. "Featured" on the rental does not feature the sale.',
              },
            },
          ],
        },
        {
          label: 'Pricing & Terms',
          fields: [
            {
              name: 'pricing',
              type: 'group',
              admin: {
                components: {
                  Cell: '/components/payload/PriceCell#PriceCell',
                },
              },
              fields: [
                {
                  name: 'currency',
                  type: 'select',
                  defaultValue: 'INR',
                  options: [{ label: 'INR', value: 'INR' }],
                },
                {
                  name: 'price',
                  type: 'number',
                  label: 'Asking price',
                  min: 0,
                  admin: { condition: (data) => onlyFor('sale')(data) },
                },
                {
                  name: 'priceOnRequest',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'negotiable',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'pricePerSqFt',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('sale')(data) },
                },
                {
                  name: 'additionalCharges',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('sale')(data) },
                },
                {
                  name: 'rentAmount',
                  type: 'number',
                  label: 'Rent',
                  min: 0,
                  admin: { condition: (data) => onlyFor('rent')(data) },
                },
                {
                  name: 'rentPeriod',
                  type: 'select',
                  defaultValue: 'monthly',
                  options: [
                    { label: 'Monthly', value: 'monthly' },
                    { label: 'Quarterly', value: 'quarterly' },
                    { label: 'Yearly', value: 'yearly' },
                  ],
                  admin: { condition: (data) => onlyFor('rent')(data) },
                },
                {
                  name: 'securityDeposit',
                  type: 'number',
                  min: 0,
                  admin: {
                    description: 'Independent of any other listing on this property.',
                    condition: (data) => onlyFor('rent', 'lease')(data),
                  },
                },
                {
                  name: 'maintenanceCharges',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('rent', 'lease')(data) },
                },
                {
                  name: 'maintenanceIncluded',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { condition: (data) => onlyFor('rent')(data) },
                },
                {
                  name: 'brokerageFee',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('rent')(data) },
                },
                {
                  name: 'totalLeaseAmount',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('lease')(data) },
                },
                {
                  name: 'monthlyLeasePayment',
                  type: 'number',
                  min: 0,
                  admin: { condition: (data) => onlyFor('lease')(data) },
                },
                {
                  name: 'parkingCharges',
                  type: 'number',
                  label: 'Parking Charges',
                  min: 0,
                  admin: {
                    description:
                      'Separate from the price/rent above — a one-off or recurring charge for parking, when applicable.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Internal',
          description: 'Never shown on the public website — visible to signed-in RER staff only.',
          fields: [
            {
              name: 'assignedAgent',
              type: 'relationship',
              relationTo: 'users',
              hasMany: false,
              label: 'Assigned agent',
              access: staffOnly,
              admin: {
                description: 'The RER team member handling enquiries and negotiation for this listing.',
              },
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              label: 'Internal notes',
              access: staffOnly,
              admin: {
                description: 'Negotiation notes, owner instructions, migration remarks.',
              },
            },
          ],
        },
      ],
    },
  ],
};
