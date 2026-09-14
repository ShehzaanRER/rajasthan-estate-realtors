import { lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Access, CollectionConfig } from 'payload';
import { PUBLIC_STATUSES } from '../lib/properties/publicScope';
import { generateNearbyLocationsHandler } from './endpoints/generateNearbyLocations';
import { createAssignMediaFolderHook, filterMediaByFolder } from './hooks/assignMediaFolder';
import { assignPropertyId } from './hooks/assignPropertyId';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

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
    defaultColumns: ['propertyId', 'title', 'purpose', 'propertyCategory', 'propertyType', 'pricing', 'status', 'updatedAt'],
  },

  defaultSort: '-updatedAt',

  access: {
    read: readPublicOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  hooks: {
    beforeChange: [assignPropertyId],
    afterChange: [createAssignMediaFolderHook({ collectionSlug: 'properties', rerIdField: 'propertyId' })],
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
      admin: {
        position: 'sidebar',
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
              required: true,
              unique: true,
            },
            {
              name: 'purpose',
              type: 'select',
              required: true,
              label: 'Transaction type',
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
          label: 'Transaction & Pricing',
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
                  name: 'area',
                  type: 'number',
                },
                {
                  name: 'areaUnit',
                  type: 'select',
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
            'Internal rental record for this property. Never shown on the public website — visible to signed-in RER staff only.',
          fields: [
            {
              name: 'rentDetails',
              type: 'group',
              label: 'Rent Details',
              // Internal inventory data. Stripped from every unauthenticated
              // read (REST/GraphQL included) so it can never leak through the
              // public API, even though non-public properties are already
              // hidden by the collection's `read` access.
              access: {
                read: ({ req: { user } }) => Boolean(user),
              },
              fields: [
                {
                  name: 'licenseeName',
                  type: 'text',
                  label: 'Licensee Name',
                  // Required only once the property is actually marked Rented,
                  // so historical/incomplete inventory can still be saved.
                  validate: (value: unknown, { data }: { data?: unknown }) => {
                    const status = (data as { status?: string } | undefined)?.status;
                    if (status === 'rented' && !String(value ?? '').trim()) {
                      return 'Licensee Name is required when the property status is Rented.';
                    }

                    return true;
                  },
                  admin: {
                    description: 'Required once the property status is set to Rented.',
                  },
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
                  name: 'agreementEndDate',
                  type: 'date',
                  label: 'Agreement End Date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
                {
                  name: 'agreementTerm',
                  type: 'text',
                  label: 'Agreement Term',
                  admin: {
                    description: 'Free text, e.g. "11 months", "36 months", "3 years".',
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
      ],
    },
  ],
};
