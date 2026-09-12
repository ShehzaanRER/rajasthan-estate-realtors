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
    useAsTitle: 'title',
    defaultColumns: ['title', 'propertyId', 'purpose', 'propertyCategory', 'propertyType', 'status', 'updatedAt'],
  },

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
      name: 'propertyId',
      type: 'text',
      label: 'Property ID',
      unique: true,
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
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
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
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
    {
      name: 'pricing',
      type: 'group',
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
    {
      name: 'amenities',
      type: 'relationship',
      relationTo: 'amenities',
      hasMany: true,
      label: 'Amenities',
    },
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
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Available', value: 'available' },
        { label: 'Under offer', value: 'under-offer' },
        { label: 'Sold', value: 'sold' },
        { label: 'Rented', value: 'rented' },
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
  ],
};
