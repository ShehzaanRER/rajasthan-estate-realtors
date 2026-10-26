import { lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Access, CollectionConfig } from 'payload';
import { calculateAgreementEndDate } from '../lib/properties/agreementDates';
import { PUBLIC_STATUSES } from '../lib/properties/publicScope';
import { generateNearbyLocationsHandler } from './endpoints/generateNearbyLocations';
import { createAssignMediaFolderHook, filterMediaByFolder } from './hooks/assignMediaFolder';
import { assignPropertyId } from './hooks/assignPropertyId';
import { assignPropertySlug } from './hooks/assignPropertySlug';
import { createInitialListing, validateInitialListing } from './hooks/initialListing';
import { protectPropertyWithListings } from './hooks/protectPropertyWithListings';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * Slugs that must stay available to the site's own routing rather than being
 * claimed by a listing. `in` is reserved for the locality landing pages planned
 * for a later phase (`/properties/in/<locality>`); the rest are obvious
 * path segments someone could reach for by accident.
 */
const RESERVED_PROPERTY_SLUGS = new Set([
  'in',
  'all',
  'new',
  'page',
  'search',
  'properties',
  'projects',
]);

/** Lowercase words and digits, joined by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Characters that would break a URL path segment outright. */
const UNSAFE_SLUG_PATTERN = /[\s/?#%\\]/;

const readPublicOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    status: {
      in: [...PUBLIC_STATUSES],
    },
  };
};

export const Properties: CollectionConfig = {
  slug: 'properties',

  admin: {
    group: 'Listings',
    useAsTitle: 'title',
    defaultColumns: ['propertyId', 'title', 'propertyCategory', 'propertyType', 'listingsSummary', 'status', 'currentAgreementEndDate', 'updatedAt'],
    components: {
      // Synchronized top scrollbar for the list table — see
      // components/payload/TableScrollSync.tsx.
      beforeListTable: ['/components/payload/TableScrollSync#TableScrollSync'],
    },
  },

  defaultSort: '-updatedAt',

  access: {
    read: readPublicOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  hooks: {
    // Create-only: checks the optional First listing group before anything is
    // written or a Property ID is allocated — see collections/hooks/initialListing.ts.
    beforeValidate: [validateInitialListing],
    // Order matters: assignPropertySlug reads the propertyId that
    // assignPropertyId allocates. Both run before field validation, which
    // Payload performs during its field-level beforeChange pass.
    beforeChange: [assignPropertyId, assignPropertySlug],
    // createInitialListing runs last and inside the same transaction, so a failure
    // rolls back the property and its media folder too.
    afterChange: [
      createAssignMediaFolderHook({ collectionSlug: 'properties', rerIdField: 'propertyId' }),
      createInitialListing,
    ],
    // A property with listings cannot be deleted — see protectPropertyWithListings.
    beforeDelete: [protectPropertyWithListings],
  },

  endpoints: [
    {
      path: '/:id/generate-nearby-locations',
      method: 'post',
      handler: generateNearbyLocationsHandler,
    },
  ],

  fields: [
    // ==========================================================
    // SIDEBAR — always visible regardless of the active tab.
    // propertyId/mediaFolder are system-managed (see their own
    // access/admin config); status is surfaced here because it's
    // the single field staff check/change most often.
    // ==========================================================
    {
      name: 'propertyId',
      type: 'text',
      label: 'Property ID',
      unique: true,
      access: {
        update: () => false,
      },
      // Duplicating a property re-runs `assignPropertyId` (it treats the
      // duplicate as a normal `create`), which always allocates a fresh ID
      // from the sequence regardless of what's here — this hook is
      // defense-in-depth so a duplicate's transient copy never resembles a
      // real ID even for the brief moment before that hook runs. Returns
      // `null`, not `undefined` — see the identical note on the `slug`
      // field below for why `undefined` would be a no-op here.
      hooks: {
        beforeDuplicate: [() => null],
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Assigned automatically when the property is created. Permanent and not editable.',
      },
    },
    {
      name: 'mediaFolder',
      type: 'relationship',
      relationTo: 'payload-folders',
      hasMany: false,
      unique: true,
      access: {
        update: () => false,
      },
      // A `unique` relationship field gets a Payload-injected default
      // `beforeDuplicate` hook that resolves to `undefined` — but Payload's
      // own beforeDuplicate runner only writes a hook result back when it is
      // NOT `undefined` (see the note on `slug` above), so that default is
      // silently a no-op and the duplicate would otherwise carry the SAME
      // folder ID as the original, violating this field's own unique
      // constraint. Explicitly clearing it here lets
      // createAssignMediaFolderHook (afterChange) create a fresh folder
      // scoped to the duplicate's own new Property ID — the same path a
      // brand-new property already takes.
      hooks: {
        beforeDuplicate: [() => null],
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'Media folder auto-created for this property\'s permanent Property ID. System-managed — cannot be changed here.',
      },
    },
    {
      name: 'mediaFolderLink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/payload/MediaFolderLink#MediaFolderLink',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      // A duplicate must never accidentally publish: force every duplicate
      // to start as Draft (never public — see publicScope.ts) regardless of
      // the source property's status. This collection has no drafts/versions
      // system, so Payload's own built-in duplicate-as-draft behavior (which
      // only applies to the `_status` field of versioned collections) does
      // not cover this field — this hook is what makes duplication safe.
      hooks: {
        beforeDuplicate: [() => 'draft'],
      },
      // System-maintained roll-up of this property's listings — see
      // lib/listings/rollup.ts. Each Listing owns its own status; this one only
      // summarises them (and keeps public read access to the property working),
      // so it is not editable here. The roll-up hook writes it with
      // overrideAccess, which bypasses this field-level rule.
      access: {
        update: () => false,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          "Summary of this property's listings, set automatically: Available if any listing is live, otherwise the most advanced listing status. Change a listing's own status in the Listings tab.",
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
      ],
    },
    {
      // Sidebar-only display, not a second data field — currentAgreementEndDate
      // already lives in the Rent Details tab (see below); this just reads
      // that same value out of the live form and shows it here too, for a
      // quick-glance "when does this lease end" right under Status. Rented
      // properties only — see AgreementCountdownSidebar.
      name: 'agreementCountdown',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/payload/AgreementCountdownSidebar#AgreementCountdownSidebar',
        },
      },
    },

    {
      // Read-only list of this property's listings (Listing ID, type, status,
      // price) with links — the list-view Cell is what lets staff see sale vs
      // rent at a glance. The Listings tab holds the editable join.
      name: 'listingsSummary',
      type: 'ui',
      label: 'Listings',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/payload/PropertyListingsSummary#PropertyListingsSummary',
          Cell: '/components/payload/PropertyListingsCell#PropertyListingsCell',
        },
      },
    },
    {
      // Derived from the listings (see lib/listings/rollup.ts): true while any
      // Rent or Lease listing of this property is marked Rented. A flat can be
      // for sale and let to a tenant at once, which the single `status` above
      // cannot express — renewal tracking and the tenancy checks key off this.
      name: 'isTenanted',
      type: 'checkbox',
      label: 'Currently tenanted',
      defaultValue: false,
      index: true,
      access: {
        update: () => false,
      },
      hooks: {
        beforeDuplicate: [() => false],
      },
      admin: {
        hidden: true,
        readOnly: true,
      },
    },

    // ==========================================================
    // MAIN AREA — unnamed tabs. Unnamed tabs are purely a Payload
    // admin-UI grouping: none of them add a `name`, so every field
    // below stays exactly where it already is in the document
    // (e.g. `location.locality`, not `location.tabName.locality`).
    // This means payload-types.ts, mapProperty.ts, and every public
    // query/filter keeps reading the exact same paths as before.
    // ==========================================================
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              // Kept required so the database column stays NOT NULL. The custom
              // `validate` below replaces Payload's default check (a custom
              // validate fully supersedes it), which is what lets the field be
              // left empty in the admin on create and filled by
              // assignPropertySlug before the record is written.
              required: true,
              unique: true,
              // Without this, duplicating a property would default (per
              // Payload's own handling of required/unique text fields on
              // duplicate) to "<original-slug> - Copy" — a value that both
              // collides in spirit with the original and fails the slug
              // format validation below (spaces, capital letters). Clearing
              // it here means the duplicate arrives with no slug, so
              // assignPropertySlug generates a fresh, valid, unique one from
              // the duplicate's own newly-assigned Property ID — exactly the
              // same path a brand-new property takes.
              //
              // Must return `null`, not `undefined`: Payload's beforeDuplicate
              // field-hook runner only writes a hook's return value back onto
              // the duplicated document when that value is NOT `undefined`
              // (see @payloadcms's fields/hooks/beforeDuplicate/promise.js) —
              // `undefined` means "leave this field's copied value alone,"
              // which is the opposite of what's needed here.
              hooks: {
                beforeDuplicate: [() => null],
              },
              admin: {
                // Lays the input and the Slug Update button out side by side —
                // see §12 of app/(payload)/custom.scss.
                className: 'rer-slug-field',
                components: {
                  // Renders inside this field's own wrapper, right after the
                  // input. The slug is only generated automatically on create
                  // (see assignPropertySlug), so this is the one way to rebuild
                  // it afterwards — needed most often on a duplicate, whose
                  // generated slug still describes the property it was copied
                  // from. See components/payload/RegenerateSlugButton.tsx.
                  afterInput: ['/components/payload/RegenerateSlugButton#RegenerateSlugButton'],
                },
                description:
                  'Leave blank on a new property — generated automatically from BHK, property type, locality and the RER ID (e.g. 2-bhk-apartment-andheri-west-rer-00042). It is the public URL, so it is never rewritten by later edits. Use "Slug Update" to rebuild it from the current values — after duplicating a property, or after correcting its locality, BHK or type.',
              },
              validate: (value: unknown, { operation }: { operation?: string }) => {
                if (typeof value !== 'string' || !value.trim()) {
                  // Expected on create: assignPropertySlug fills it server-side.
                  return operation === 'create' ? true : 'A slug is required.';
                }

                const slug = value.trim();

                if (operation === 'create') {
                  if (!SLUG_PATTERN.test(slug)) {
                    return 'Use lowercase letters, numbers and single hyphens only — for example 2-bhk-apartment-andheri-west.';
                  }

                  if (RESERVED_PROPERTY_SLUGS.has(slug)) {
                    return `"${slug}" is reserved for site navigation. Please choose a different slug.`;
                  }

                  return true;
                }

                // On update the strict shape is deliberately not enforced.
                // Properties created before automatic slugs exist with slugs
                // such as "Andheri", and those URLs are already live — refusing
                // the save would make those records uneditable. Only reject
                // characters that would genuinely break the URL.
                if (UNSAFE_SLUG_PATTERN.test(slug)) {
                  return 'A slug cannot contain spaces, slashes or other URL-reserved characters.';
                }

                return true;
              },
            },
            {
              // LEGACY — the transaction type now lives on each Listing. Kept in
              // the schema (and populated for every pre-existing property) so
              // the migration is expand-only and nothing is lost; hidden and no
              // longer required so a property can be created before any listing
              // exists. Nothing on the public site reads it. Drop it only in a
              // separate, explicitly approved clean-up once every environment
              // has been migrated — see docs/CLAUDE/DECISIONS.md.
              name: 'purpose',
              type: 'select',
              required: false,
              label: 'Transaction type (legacy)',
              admin: {
                hidden: true,
              },
              options: [
                { label: 'Sale', value: 'sale' },
                { label: 'Rent', value: 'rent' },
                { label: 'Lease', value: 'lease' },
              ],
            },
            {
              name: 'propertyCategory',
              type: 'select',
              required: false,
              label: 'Property category',
              options: [
                { label: 'Residential', value: 'residential' },
                { label: 'Commercial', value: 'commercial' },
              ],
            },
            {
              name: 'propertyType',
              type: 'select',
              required: true,
              options: [
                { label: 'Apartment', value: 'apartment' },
                { label: 'House', value: 'house' },
                { label: 'Villa', value: 'villa' },
                { label: 'Office', value: 'office' },
                { label: 'Shop', value: 'shop' },
                { label: 'Showroom', value: 'showroom' },
                { label: 'Warehouse', value: 'warehouse' },
                { label: 'Land', value: 'land' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'tags',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'New', value: 'new' },
                { label: 'Featured', value: 'featured' },
                { label: 'New development', value: 'new-development' },
                { label: 'Under construction', value: 'under-construction' },
                { label: 'Ready to move', value: 'ready-to-move' },
                { label: 'Premium', value: 'premium' },
                { label: 'Price reduced', value: 'price-reduced' },
                { label: 'Commercial', value: 'commercial' },
                { label: 'Residential', value: 'residential' },
              ],
            },
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor(),
            },
            {
              // Create-only, never stored on the property (`virtual`): lets an
              // agent create the property and its first Sale or Rent listing in
              // one save, without retyping anything. Turned into a real Listing
              // by collections/hooks/initialListing.ts inside the same
              // transaction. Further listings are added from the Listings tab.
              name: 'initialListing',
              type: 'group',
              virtual: true,
              label: 'First listing (optional)',
              admin: {
                // Payload renders virtual fields read-only unless told otherwise;
                // this group is an input, not a computed value.
                readOnly: false,
                condition: (_data, _siblingData, { operation }) => operation === 'create',
                description:
                  "Choose Sale or Rent to create this property's first listing in the same save. Leave it empty to add listings later from the Listings tab. A second listing (e.g. Rent as well as Sale) is always added from the Listings tab.",
              },
              fields: [
                {
                  name: 'transactionType',
                  type: 'select',
                  label: 'Transaction type',
                  options: [
                    { label: 'Sale', value: 'sale' },
                    { label: 'Rent', value: 'rent' },
                  ],
                },
                {
                  name: 'status',
                  type: 'select',
                  label: 'Listing status',
                  options: [
                    { label: 'Draft — not on the website yet', value: 'draft' },
                    { label: 'Available — live on the website', value: 'available' },
                  ],
                  admin: {
                    condition: (_data, siblingData) => Boolean(siblingData?.transactionType),
                  },
                },
                {
                  name: 'price',
                  type: 'number',
                  label: 'Asking price',
                  min: 0,
                  admin: {
                    condition: (_data, siblingData) => siblingData?.transactionType === 'sale',
                  },
                },
                {
                  name: 'rentAmount',
                  type: 'number',
                  label: 'Monthly rent',
                  min: 0,
                  admin: {
                    condition: (_data, siblingData) => siblingData?.transactionType === 'rent',
                  },
                },
                {
                  name: 'securityDeposit',
                  type: 'number',
                  label: 'Security deposit',
                  min: 0,
                  admin: {
                    condition: (_data, siblingData) => siblingData?.transactionType === 'rent',
                  },
                },
                {
                  name: 'maintenanceCharges',
                  type: 'number',
                  label: 'Maintenance charges',
                  min: 0,
                  admin: {
                    condition: (_data, siblingData) => siblingData?.transactionType === 'rent',
                  },
                },
                {
                  name: 'priceOnRequest',
                  type: 'checkbox',
                  label: 'Price on request',
                  admin: {
                    condition: (_data, siblingData) => Boolean(siblingData?.transactionType),
                  },
                },
                {
                  name: 'negotiable',
                  type: 'checkbox',
                  label: 'Negotiable',
                  admin: {
                    condition: (_data, siblingData) => Boolean(siblingData?.transactionType),
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'location',
              type: 'group',
              fields: [
                {
                  name: 'locality',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'area',
                  type: 'text',
                },
                {
                  name: 'city',
                  type: 'text',
                  required: true,
                  defaultValue: 'Mumbai',
                },
                {
                  name: 'state',
                  type: 'text',
                  defaultValue: 'Maharashtra',
                },
                {
                  name: 'address',
                  type: 'textarea',
                },
                {
                  name: 'flatNo',
                  type: 'text',
                  label: 'Flat No.',
                  // Internal reference only — same field-level gate as
                  // Rent Details, so it is stripped from every
                  // unauthenticated read (REST/GraphQL) and never reaches
                  // the public website regardless of what mapProperty.ts
                  // chooses to expose.
                  access: {
                    read: ({ req: { user } }) => Boolean(user),
                  },
                  admin: {
                    description: 'Internal reference only — never shown on the public website.',
                  },
                },
                {
                  name: 'latitude',
                  type: 'number',
                  label: 'Latitude',
                  required: false,
                  admin: {
                    description: 'Optional. Used later to generate nearby connectivity. Not required to save a property.',
                  },
                },
                {
                  name: 'longitude',
                  type: 'number',
                  label: 'Longitude',
                  required: false,
                  admin: {
                    description: 'Optional. Used later to generate nearby connectivity. Not required to save a property.',
                  },
                },
              ],
            },
            {
              name: 'nearbyConnectivity',
              type: 'group',
              label: 'Nearby Connectivity',
              admin: {
                description:
                  'Generate suggestions from the saved property coordinates, then choose which places to add. Only entries with Show on Website enabled are intended for the public listing.',
              },
              fields: [
                {
                  name: 'generateNearbyLocations',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '/components/payload/GenerateNearbyLocations#GenerateNearbyLocations',
                    },
                  },
                },
                {
                  name: 'connections',
                  type: 'array',
                  label: 'Connections',
                  labels: {
                    singular: 'Connection',
                    plural: 'Connections',
                  },
                  admin: {
                    description:
                      'Add nearby places manually. Drag to set display order. Hidden entries are kept internally and are not intended for the public website.',
                    isSortable: true,
                  },
                  fields: [
                    {
                      name: 'name',
                      type: 'text',
                      label: 'Place Name',
                      required: true,
                    },
                    {
                      name: 'category',
                      type: 'select',
                      label: 'Category',
                      required: true,
                      options: [
                        { label: 'Transport', value: 'transport' },
                        { label: 'Metro', value: 'metro' },
                        { label: 'Railway Station', value: 'railway-station' },
                        { label: 'Airport', value: 'airport' },
                        { label: 'Road / Highway', value: 'road-highway' },
                        { label: 'School', value: 'school' },
                        { label: 'College', value: 'college' },
                        { label: 'Hospital', value: 'hospital' },
                        { label: 'Shopping', value: 'shopping' },
                        { label: 'Restaurant', value: 'restaurant' },
                        { label: 'Business District', value: 'business-district' },
                        { label: 'Park', value: 'park' },
                        { label: 'Religious Place', value: 'religious-place' },
                        { label: 'Other', value: 'other' },
                      ],
                    },
                    {
                      name: 'travelTimeMinutes',
                      type: 'number',
                      label: 'Travel Time (Minutes)',
                      required: false,
                    },
                    {
                      name: 'distance',
                      type: 'number',
                      label: 'Distance',
                      required: false,
                    },
                    {
                      name: 'distanceUnit',
                      type: 'select',
                      label: 'Distance Unit',
                      required: false,
                      options: [
                        { label: 'Kilometres', value: 'km' },
                        { label: 'Metres', value: 'm' },
                      ],
                    },
                    {
                      name: 'displayOnWebsite',
                      type: 'checkbox',
                      label: 'Show on Website',
                      defaultValue: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Listings',
          description:
            'Each sale, rental or lease of this property is a separate listing with its own price, terms and status. Add a listing here — the address, specifications and photographs are shared and never re-entered.',
          fields: [
            {
              name: 'listings',
              type: 'join',
              collection: 'listings',
              on: 'property',
              label: 'Listings of this property',
              defaultSort: 'transactionType',
              defaultLimit: 25,
              admin: {
                allowCreate: true,
                defaultColumns: ['listingId', 'transactionType', 'status', 'pricing', 'updatedAt'],
              },
            },
            {
              // LEGACY — pricing moved to the Listing. Retained in the schema
              // because the migration is expand-only: every pre-existing
              // property keeps the price it was created with, and the migration
              // copies (never moves) it onto the new listing. Hidden; nothing on
              // the public site or the console reads it any more.
              name: 'pricing',
              type: 'group',
              label: 'Pricing (legacy)',
              admin: {
                hidden: true,
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
                  label: 'Price',
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
                  admin: {
                    condition: (data) => data?.purpose === 'sale',
                  },
                },
                {
                  name: 'additionalCharges',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'sale',
                  },
                },
                {
                  name: 'rentAmount',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'rent',
                  },
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
                  admin: {
                    condition: (data) => data?.purpose === 'rent',
                  },
                },
                {
                  name: 'securityDeposit',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'rent' || data?.purpose === 'lease',
                  },
                },
                {
                  name: 'maintenanceCharges',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'rent' || data?.purpose === 'lease',
                  },
                },
                {
                  name: 'maintenanceIncluded',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    condition: (data) => data?.purpose === 'rent',
                  },
                },
                {
                  name: 'brokerageFee',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'rent',
                  },
                },
                {
                  name: 'totalLeaseAmount',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'lease',
                  },
                },
                {
                  name: 'monthlyLeasePayment',
                  type: 'number',
                  admin: {
                    condition: (data) => data?.purpose === 'lease',
                  },
                },
                {
                  name: 'parkingCharges',
                  type: 'number',
                  label: 'Parking Charges',
                  admin: {
                    description: 'Separate from the price/rent above — a one-off or recurring charge for parking, when applicable.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Property Details',
          fields: [
            {
              name: 'details',
              type: 'group',
              fields: [
                {
                  name: 'bedrooms',
                  type: 'number',
                },
                {
                  name: 'bathrooms',
                  type: 'number',
                },
                {
                  name: 'carpetArea',
                  type: 'number',
                  label: 'Carpet Area',
                  admin: {
                    description:
                      'Usable floor area within the walls, excluding common areas — the RERA carpet area figure.',
                  },
                },
                {
                  name: 'carpetAreaUnit',
                  type: 'select',
                  label: 'Carpet Area Unit',
                  defaultValue: 'sq-ft',
                  options: [
                    { label: 'sq ft', value: 'sq-ft' },
                    { label: 'sq m', value: 'sq-m' },
                  ],
                },
                {
                  name: 'builtUpArea',
                  type: 'number',
                  label: 'Built-up Area',
                  admin: {
                    description:
                      'Carpet area plus wall thickness, balconies and other covered space — typically larger than Carpet Area.',
                  },
                },
                {
                  name: 'builtUpAreaUnit',
                  type: 'select',
                  label: 'Built-up Area Unit',
                  defaultValue: 'sq-ft',
                  options: [
                    { label: 'sq ft', value: 'sq-ft' },
                    { label: 'sq m', value: 'sq-m' },
                  ],
                },
                {
                  name: 'furnishing',
                  type: 'select',
                  options: [
                    { label: 'Unfurnished', value: 'unfurnished' },
                    { label: 'Semi-furnished', value: 'semi-furnished' },
                    { label: 'Furnished', value: 'furnished' },
                  ],
                },
                {
                  name: 'parking',
                  type: 'number',
                  label: 'Parking',
                  admin: {
                    description: 'Number of parking spots included with this unit. Leave blank if not tracked.',
                  },
                },
                {
                  name: 'balconies',
                  type: 'number',
                  label: 'Balconies',
                  admin: {
                    condition: (data) => data?.propertyCategory === 'residential',
                  },
                },
                {
                  name: 'propertyAge',
                  type: 'number',
                  label: 'Property Age (Years)',
                  admin: {
                    condition: (data) => data?.propertyCategory === 'residential',
                  },
                },
                {
                  name: 'possessionStatus',
                  type: 'select',
                  label: 'Possession Status',
                  options: [
                    { label: 'Ready to Move', value: 'ready-to-move' },
                    { label: 'Under Construction', value: 'under-construction' },
                  ],
                  admin: {
                    condition: (data) => data?.propertyCategory === 'residential',
                  },
                },
                {
                  name: 'cabins',
                  type: 'number',
                  label: 'Number of Cabins',
                  admin: {
                    condition: (data) => data?.propertyCategory === 'commercial',
                  },
                },
                {
                  name: 'workstations',
                  type: 'number',
                  label: 'Number of Workstations',
                  admin: {
                    condition: (data) => data?.propertyCategory === 'commercial',
                  },
                },
                {
                  name: 'meetingRooms',
                  type: 'number',
                  label: 'Number of Meeting Rooms',
                  admin: {
                    condition: (data) => data?.propertyCategory === 'commercial',
                  },
                },
                {
                  name: 'pantryAvailable',
                  type: 'checkbox',
                  label: 'Pantry Available',
                  defaultValue: false,
                  admin: {
                    condition: (data) => data?.propertyCategory === 'commercial',
                  },
                },
                {
                  name: 'fitOutStatus',
                  type: 'select',
                  label: 'Fit-out Status',
                  options: [
                    { label: 'Bare Shell', value: 'bare-shell' },
                    { label: 'Warm Shell', value: 'warm-shell' },
                    { label: 'Fitted', value: 'fitted' },
                  ],
                  admin: {
                    condition: (data) => data?.propertyCategory === 'commercial',
                  },
                },
              ],
            },
            {
              name: 'buildingDetails',
              type: 'group',
              label: 'Building Details',
              fields: [
                {
                  name: 'buildingName',
                  type: 'text',
                  label: 'Building Name',
                },
                {
                  name: 'totalFloors',
                  type: 'number',
                  label: 'Total Floors',
                  admin: {
                    description: 'Total number of floors in the building.',
                  },
                },
                {
                  name: 'floorNumber',
                  type: 'number',
                  label: 'Property Floor Number',
                  admin: {
                    description: 'Floor on which this property/unit is located.',
                  },
                },
                {
                  name: 'liftAvailable',
                  type: 'checkbox',
                  label: 'Lift Available',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: 'Amenities',
          fields: [
            {
              name: 'amenities',
              type: 'relationship',
              relationTo: 'amenities',
              hasMany: true,
              label: 'Amenities',
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            {
              name: 'media',
              type: 'group',
              fields: [
                {
                  name: 'featuredImage',
                  type: 'upload',
                  relationTo: 'media',
                  required: false,
                  filterOptions: filterMediaByFolder,
                  admin: {
                    description:
                      'Main property image used as the cover photo in listings and on the property page. Only media filed under this property\'s own folder can be selected.',
                  },
                },
                {
                  name: 'gallery',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  required: false,
                  filterOptions: filterMediaByFolder,
                  admin: {
                    isSortable: true,
                    description:
                      'Additional property photos. Drag to reorder. Set alt text and optional caption on each Media item. Only media filed under this property\'s own folder can be selected.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Rent Details',
          description:
            'Internal tenancy record for this property — add a new Tenancy History entry each time the tenant or lease term changes. Never shown on the public website — visible to signed-in RER staff only.',
          fields: [
            {
              // Denormalized from the LAST Tenancy History entry below, so
              // the property list can sort/filter on it — a `virtual` field
              // (computed only at read time) cannot be sorted or filtered by
              // Payload's list view, since that view queries the database
              // directly before any afterRead hook runs. This is a real
              // stored column, kept in sync on every save.
              name: 'currentAgreementEndDate',
              type: 'date',
              label: 'Current Agreement End Date',
              admin: {
                readOnly: true,
                date: {
                  pickerAppearance: 'dayOnly',
                },
                description:
                  'System-calculated from the last Tenancy History entry below (Agreement Start Date + Term − 1 day). Read-only — add or edit a Tenancy History entry to change it. Kept here, denormalized, so the property list can be sorted by it.',
                components: {
                  Cell: '/components/payload/AgreementCountdownCell#AgreementCountdownCell',
                },
              },
              // Internal inventory data — same gate as the Tenancy History
              // it's derived from. A denormalized top-level field does NOT
              // inherit rentHistory's own access rule, so this must be set
              // explicitly or the data would leak through the public API.
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
              // Recomputed from scratch on every save — deliberately NOT
              // read from `rentHistory[last].agreementEndDate` (that value
              // is itself produced by that row's own beforeChange hook, and
              // this field's hook could run before or after it depending on
              // field-declaration order; recomputing directly from the same
              // start date + term makes correctness independent of hook
              // ordering). Falls back to the row's own stored end date only
              // when a fresh calculation isn't possible — e.g. a historical
              // entry with a manually-entered end date and no term months.
              hooks: {
                beforeChange: [
                  ({ data }) => {
                    const history = Array.isArray(data?.rentHistory) ? data.rentHistory : [];
                    const last = history[history.length - 1];
                    if (!last) {
                      return null;
                    }

                    const calculated = calculateAgreementEndDate({
                      startDate: last.agreementStartDate ?? null,
                      termMonths: last.agreementTermMonths ?? null,
                      termDays: last.agreementTermDays ?? null,
                    });

                    return calculated ? calculated.toISOString() : (last.agreementEndDate ?? null);
                  },
                ],
              },
            },
            {
              // LEGACY — superseded by `rentHistory` below. Kept (not
              // deleted) as a hidden backup of the one pre-existing flat
              // rental record this project had before Tenancy History
              // existed, per an explicit decision to migrate-then-hide
              // rather than migrate-then-delete. `admin.hidden` only
              // affects rendering — the field and its data stay fully live
              // in the schema/DB/API.
              name: 'rentDetails',
              type: 'group',
              label: 'Rent Details (Legacy)',
              admin: {
                hidden: true,
              },
              // Internal inventory data. Stripped from every unauthenticated
              // read (REST/GraphQL included) so it can never leak through the
              // public API, even though non-public properties are already
              // hidden by the collection's `read` access.
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
              // Tenancy history is unit-specific: a duplicated property must
              // start with a clean slate, never a copy of another unit's
              // tenant/agreement/notes. Must return a real empty object, not
              // `undefined` — Payload's beforeDuplicate runner only writes a
              // hook's result back onto the duplicate when it is NOT
              // `undefined` (confirmed against
              // @payloadcms/*/fields/hooks/beforeDuplicate/promise.js), so
              // `undefined` here would be a no-op and silently carry the
              // old tenant's data into the new property.
              hooks: {
                beforeDuplicate: [() => ({})],
              },
              fields: [
                {
                  name: 'licenseeName',
                  type: 'text',
                  label: 'Licensee Name',
                  // The old "required when Rented" validate is deliberately
                  // removed: this field is hidden and no longer editable via
                  // the admin UI, but Payload still runs field validation on
                  // every save regardless of admin.hidden. Leaving that
                  // check in place would re-evaluate the live `status` field
                  // on every future save and block it, since staff can no
                  // longer fill in this frozen field. That responsibility
                  // now belongs to `rentHistory`'s own array-level validate.
                },
                {
                  name: 'licenseeContactNumber',
                  type: 'text',
                  label: 'Licensee Contact Number',
                },
                {
                  name: 'monthlyRent',
                  type: 'number',
                  label: 'Monthly Rent',
                  admin: {
                    description: 'Amount in INR. Numbers only — no currency symbol or commas.',
                  },
                },
                {
                  name: 'securityDeposit',
                  type: 'number',
                  label: 'Security Deposit',
                  admin: {
                    description: 'Amount in INR. Numbers only — no currency symbol or commas.',
                  },
                },
                {
                  name: 'agreementStartDate',
                  type: 'date',
                  label: 'Agreement Start Date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
                {
                  name: 'agreementTermMonths',
                  type: 'number',
                  label: 'Agreement Term (Months)',
                  admin: {
                    description:
                      'Whole number of months (e.g. 11, 36). Drives the automatic Agreement End Date below — leave blank if the term is only described in the free-text Agreement Term field further down.',
                  },
                },
                {
                  name: 'agreementEndDate',
                  type: 'date',
                  label: 'Agreement End Date',
                  admin: {
                    readOnly: true,
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                    description:
                      'Calculated automatically as the last day of the term — Agreement Start Date + Agreement Term (Months) − 1 day. Fill in both fields above to set it — it cannot be edited directly.',
                  },
                  // Recomputes deterministically whenever both inputs are
                  // present, overwriting any prior value — that's the one
                  // case this field is allowed to change on its own. If
                  // either input is missing, the field is left exactly as
                  // submitted: empty on a brand-new record, or untouched on
                  // a record that already had an explicit end date (e.g.
                  // one entered before this field existed, or one entered
                  // for a term that only exists as free text below) — never
                  // nulled out or guessed at.
                  hooks: {
                    beforeChange: [
                      ({ siblingData, value }) => {
                        const calculated = calculateAgreementEndDate({
                          startDate: siblingData?.agreementStartDate ?? null,
                          termMonths: siblingData?.agreementTermMonths ?? null,
                        });

                        return calculated ? calculated.toISOString() : value;
                      },
                    ],
                  },
                },
                {
                  name: 'agreementTerm',
                  type: 'text',
                  label: 'Agreement Term',
                  admin: {
                    description:
                      'Free text for a term that Agreement Term (Months) can\'t express cleanly, e.g. "3 years". Display/reference only — does not drive the automatic end-date calculation above.',
                  },
                },
                {
                  name: 'rentalSource',
                  type: 'select',
                  label: 'Rental Source',
                  options: [
                    { label: 'Direct', value: 'direct' },
                    { label: 'Through Agent', value: 'through-agent' },
                  ],
                },
                {
                  name: 'agentName',
                  type: 'text',
                  label: 'Agent Name',
                  validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
                    const source = (siblingData as { rentalSource?: string } | undefined)
                      ?.rentalSource;
                    if (source === 'through-agent' && !String(value ?? '').trim()) {
                      return 'Agent Name is required when Rental Source is Through Agent.';
                    }

                    return true;
                  },
                  admin: {
                    condition: (_, siblingData) => siblingData?.rentalSource === 'through-agent',
                  },
                },
                {
                  name: 'agentContactNumber',
                  type: 'text',
                  label: 'Agent Contact Number',
                  admin: {
                    condition: (_, siblingData) => siblingData?.rentalSource === 'through-agent',
                  },
                },
                {
                  name: 'rentalNotes',
                  type: 'textarea',
                  label: 'Rental Notes',
                  admin: {
                    description:
                      'Internal notes — e.g. renewal preferences, who holds the keys, coordination details.',
                  },
                },
              ],
            },
            {
              name: 'rentHistory',
              type: 'array',
              label: 'Rent History',
              labels: {
                singular: 'Tenancy',
                plural: 'Tenancy History',
              },
              // Internal inventory data — same gate as the legacy group
              // above. Confirmed nowhere in lib/properties/mapProperty.ts
              // (or anywhere else) reads this, so it can never leak through
              // the public API.
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
              admin: {
                isSortable: true,
                initCollapsed: true,
                description:
                  'Add a new entry each time the tenant or lease term changes. Drag rows to reorder — there is no separate "current" flag: the LAST row is always treated as the current tenancy.',
                components: {
                  RowLabel: '/components/payload/RentHistoryRowLabel#RentHistoryRowLabel',
                },
              },
              // Tenancy history is unit-specific: a duplicated property must
              // start with a clean slate. Must return a real empty array,
              // not `undefined` — see the identical note on the legacy
              // `rentDetails` group above for why `undefined` would be a
              // no-op and silently carry the old tenancy over.
              hooks: {
                beforeDuplicate: [() => []],
              },
              // The "can't be Rented with zero tenancy history" rule moved to
              // the Listing (collections/hooks/validateListing.ts), which is
              // where Rented is now set. What remains here is the reverse
              // direction: tenancy history cannot be emptied while a Rent/Lease
              // listing of this property is still marked Rented. An omitted
              // value (a partial update, the roll-up write) is not an emptying.
              validate: (value: unknown, { data }: { data?: unknown }) => {
                const isTenanted = (data as { isTenanted?: boolean } | undefined)?.isTenanted;
                if (isTenanted === true && Array.isArray(value) && value.length === 0) {
                  return 'A Rent or Lease listing of this property is marked Rented, so at least one Tenancy History entry is required.';
                }

                return true;
              },
              fields: [
                {
                  name: 'licenseeName',
                  type: 'text',
                  label: 'Licensee Name',
                  // Unconditionally required: unlike the old single-record
                  // group, an entry only exists because staff deliberately
                  // added one, so a nameless entry isn't meaningful history.
                  // This also avoids needing row-index-aware validation to
                  // detect "is this the current entry".
                  required: true,
                },
                {
                  name: 'licenseeContactNumber',
                  type: 'text',
                  label: 'Licensee Contact Number',
                },
                {
                  name: 'monthlyRent',
                  type: 'number',
                  label: 'Monthly Rent',
                  admin: {
                    description: 'Amount in INR. Numbers only — no currency symbol or commas.',
                  },
                },
                {
                  name: 'securityDeposit',
                  type: 'number',
                  label: 'Security Deposit',
                  admin: {
                    description: 'Amount in INR. Numbers only — no currency symbol or commas.',
                  },
                },
                {
                  name: 'agreementStartDate',
                  type: 'date',
                  label: 'Agreement Start Date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
                {
                  name: 'agreementTermMonths',
                  type: 'number',
                  label: 'Agreement Term (Months)',
                  // Whole, non-negative numbers only. Optional — empty is
                  // treated as zero when the end date is calculated.
                  validate: (value: unknown) => {
                    if (value == null || value === '') {
                      return true;
                    }
                    if (!Number.isInteger(Number(value)) || Number(value) < 0) {
                      return 'Agreement Term (Months) must be a whole number of 0 or more.';
                    }

                    return true;
                  },
                  admin: {
                    width: '50%',
                    step: 1,
                    description:
                      'Enter the number of complete calendar months. Drives the automatic Agreement End Date below — leave blank if the term is only described in the free-text Agreement Term field further down.',
                  },
                },
                {
                  name: 'agreementTermDays',
                  type: 'number',
                  label: 'Agreement Term (Days)',
                  // Whole, non-negative numbers only. Optional — empty is
                  // treated as zero. Added on top of the months term (or on
                  // its own) by calculateAgreementEndDate().
                  validate: (value: unknown) => {
                    if (value == null || value === '') {
                      return true;
                    }
                    if (!Number.isInteger(Number(value)) || Number(value) < 0) {
                      return 'Agreement Term (Days) must be a whole number of 0 or more.';
                    }

                    return true;
                  },
                  admin: {
                    width: '50%',
                    step: 1,
                    description: 'Add extra days to the agreement term, if applicable.',
                  },
                },
                {
                  name: 'agreementEndDate',
                  type: 'date',
                  label: 'Agreement End Date',
                  admin: {
                    readOnly: true,
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                    description:
                      'Calculated automatically from the Agreement Start Date plus the Agreement Term (Months) and/or (Days). Fill in the start date and at least one term field above to set it — it cannot be edited directly.',
                  },
                  // Same recompute rule as the legacy group's own hook —
                  // sibling scoping for an array row works exactly like a
                  // group's (confirmed against Payload's beforeDuplicate
                  // traversal, which passes `siblingDoc: row` for each array
                  // row just like a group's own siblingDoc).
                  hooks: {
                    beforeChange: [
                      ({ siblingData, value }) => {
                        const calculated = calculateAgreementEndDate({
                          startDate: siblingData?.agreementStartDate ?? null,
                          termMonths: siblingData?.agreementTermMonths ?? null,
                          termDays: siblingData?.agreementTermDays ?? null,
                        });

                        return calculated ? calculated.toISOString() : value;
                      },
                    ],
                  },
                },
                {
                  name: 'agreementTerm',
                  type: 'text',
                  label: 'Agreement Term',
                  admin: {
                    description:
                      'Free text for a term that Agreement Term (Months) can\'t express cleanly, e.g. "3 years". Display/reference only — does not drive the automatic end-date calculation above.',
                  },
                },
                {
                  name: 'rentalSource',
                  type: 'select',
                  label: 'Rental Source',
                  options: [
                    { label: 'Direct', value: 'direct' },
                    { label: 'Through Agent', value: 'through-agent' },
                  ],
                },
                {
                  name: 'agentName',
                  type: 'text',
                  label: 'Agent Name',
                  validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
                    const source = (siblingData as { rentalSource?: string } | undefined)
                      ?.rentalSource;
                    if (source === 'through-agent' && !String(value ?? '').trim()) {
                      return 'Agent Name is required when Rental Source is Through Agent.';
                    }

                    return true;
                  },
                  admin: {
                    condition: (_, siblingData) => siblingData?.rentalSource === 'through-agent',
                  },
                },
                {
                  name: 'agentContactNumber',
                  type: 'text',
                  label: 'Agent Contact Number',
                  admin: {
                    condition: (_, siblingData) => siblingData?.rentalSource === 'through-agent',
                  },
                },
                {
                  name: 'rentalNotes',
                  type: 'textarea',
                  label: 'Rental Notes',
                  admin: {
                    description:
                      'Internal notes — e.g. renewal preferences, who holds the keys, coordination details.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Owner Details',
          description:
            'Internal record of who owns this property — never shown on the public website, visible to signed-in RER staff only.',
          fields: [
            {
              name: 'ownerDetails',
              type: 'group',
              label: 'Owner Details',
              // Internal inventory data — same gate as Rent Details/flatNo, so
              // it is stripped from every unauthenticated read (REST/GraphQL
              // included) and never reaches the public website.
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
              fields: [
                {
                  name: 'ownerName',
                  type: 'text',
                  label: 'Owner Name',
                },
                {
                  name: 'ownerContact',
                  type: 'text',
                  label: 'Owner Contact',
                },
                {
                  name: 'ownerBasedIn',
                  type: 'select',
                  label: 'Owner Based In',
                  options: [
                    { label: 'Jogeshwari', value: 'jogeshwari' },
                    { label: 'Elsewhere in Mumbai', value: 'elsewhere-in-mumbai' },
                    { label: 'Outside Mumbai', value: 'outside-mumbai' },
                    { label: 'NRI', value: 'nri' },
                  ],
                },
                {
                  name: 'withRerSince',
                  type: 'number',
                  label: 'With RER Since',
                  admin: {
                    description: 'Four-digit year the owner\'s relationship with RER began, e.g. 2011.',
                  },
                  validate: (value: unknown) => {
                    if (value === undefined || value === null || value === '') {
                      return true;
                    }

                    const year = Number(value);
                    const currentYear = new Date().getFullYear();
                    if (!Number.isInteger(year) || year < 1000 || year > 9999) {
                      return 'Enter a four-digit year, e.g. 2011.';
                    }
                    if (year > currentYear) {
                      return `Year cannot be later than ${currentYear}.`;
                    }

                    return true;
                  },
                },
                {
                  name: 'openToSelling',
                  type: 'select',
                  label: 'Open to Selling',
                  defaultValue: 'not-discussed',
                  options: [
                    { label: 'Not discussed', value: 'not-discussed' },
                    { label: 'Open to offers', value: 'open-to-offers' },
                    { label: 'Actively selling', value: 'actively-selling' },
                    { label: 'Will not sell', value: 'will-not-sell' },
                  ],
                },
                {
                  name: 'renewalCalledOn',
                  type: 'date',
                  label: 'Renewal Called On',
                  admin: {
                    description: 'Date of the last renewal conversation with the owner.',
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
