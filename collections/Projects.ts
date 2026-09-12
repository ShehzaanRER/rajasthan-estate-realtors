import { lexicalEditor } from '@payloadcms/richtext-lexical';
import type { Access, FieldAccess, CollectionConfig } from 'payload';
import { PUBLIC_PROJECT_STATUSES } from '../lib/projects/publicScope';
import { createAssignMediaFolderHook, filterMediaByFolder } from './hooks/assignMediaFolder';
import { assignProjectId } from './hooks/assignProjectId';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

// Field-level access has a narrower signature than collection-level Access
// (must return a plain boolean, not a Where filter) — kept separate so the
// `source` group below never leaks to public reads regardless of status.
const isAuthenticatedField: FieldAccess = ({ req: { user } }) => Boolean(user);

const readPublicOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) {
    return true;
  }

  return {
    status: {
      in: [...PUBLIC_PROJECT_STATUSES],
    },
  };
};

export const Projects: CollectionConfig = {
  slug: 'projects',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'projectId', 'developer', 'status', 'updatedAt'],
  },

  access: {
    read: readPublicOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  hooks: {
    beforeChange: [assignProjectId],
    afterChange: [createAssignMediaFolderHook({ collectionSlug: 'projects', rerIdField: 'projectId' })],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Project Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'projectId',
      type: 'text',
      label: 'RER Project Number',
      unique: true,
      access: {
        update: () => false,
      },
      admin: {
        readOnly: true,
        description:
          'Assigned automatically when the project is created (e.g. RER-P-0001). Permanent and not editable. This is RER\'s own internal reference, not the RERA Registration Number.',
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
          'Media folder auto-created for this project\'s permanent RER Project Number. System-managed — cannot be changed here.',
      },
    },
    {
      name: 'developer',
      type: 'text',
      label: 'Developer / Builder',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: 'Project Status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Under Construction', value: 'under-construction' },
        { label: 'Ready to Move', value: 'ready-to-move' },
        { label: 'Completed', value: 'completed' },
        { label: 'Sold Out', value: 'sold-out' },
      ],
      admin: {
        description: 'Draft projects are never shown on the public website or sitemap.',
      },
    },
    {
      name: 'isNew',
      type: 'checkbox',
      label: 'New Launch',
      defaultValue: false,
      admin: {
        description:
          'Tick while this is a current launch. Tagged projects appear under "New Projects" on the homepage and carry a New Launch badge. Untick once the launch is no longer current.',
      },
    },
    {
      name: 'highlightTags',
      type: 'select',
      hasMany: true,
      label: 'Highlight Tags',
      options: [
        { label: 'Premium', value: 'premium' },
        { label: 'Luxury', value: 'luxury' },
        { label: 'Investment', value: 'investment' },
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
      ],
      admin: {
        description:
          'Optional positioning tags, separate from Project Status. At most two are shown on a project card, and status always takes priority.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      editor: lexicalEditor(),
      label: 'Project Description',
    },
    {
      name: 'highlights',
      type: 'array',
      label: 'Project Highlights',
      labels: {
        singular: 'Highlight',
        plural: 'Highlights',
      },
      admin: {
        description: 'Short standout points shown as a bullet list, e.g. "Sea-facing towers", "5-minute walk to metro".',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },

    {
      name: 'legal',
      type: 'group',
      label: 'RERA / Legal',
      fields: [
        {
          name: 'reraNumber',
          type: 'text',
          label: 'RERA Registration Number',
          admin: {
            description:
              'Supplied by the builder or the RERA authority. Entered manually here (or later by Brochure Convert). Never generated by RER\'s system — do not confuse with the RER Project Number above.',
          },
        },
        {
          name: 'reraInfo',
          type: 'textarea',
          label: 'RERA-related Notes',
          admin: {
            description: 'Optional. Any additional RERA disclosure text supplied by the builder.',
          },
        },
      ],
    },

    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'address',
          type: 'textarea',
        },
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
          name: 'pincode',
          type: 'text',
        },
        {
          name: 'latitude',
          type: 'number',
          admin: {
            description: 'Optional. Used for maps/nearby connectivity.',
          },
        },
        {
          name: 'longitude',
          type: 'number',
          admin: {
            description: 'Optional. Used for maps/nearby connectivity.',
          },
        },
      ],
    },

    {
      name: 'nearbyConnectivity',
      type: 'group',
      label: 'Nearby Connectivity',
      admin: {
        description: 'Add nearby places manually. Drag to set display order.',
      },
      fields: [
        {
          name: 'connections',
          type: 'array',
          label: 'Connections',
          labels: {
            singular: 'Connection',
            plural: 'Connections',
          },
          admin: {
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
            },
            {
              name: 'distance',
              type: 'number',
              label: 'Distance',
            },
            {
              name: 'distanceUnit',
              type: 'select',
              label: 'Distance Unit',
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
      name: 'configurations',
      type: 'array',
      label: 'Configurations',
      labels: {
        singular: 'Configuration',
        plural: 'Configurations',
      },
      admin: {
        description:
          'Add one entry per unit configuration (1 BHK, 2 BHK, Penthouse, Commercial unit, etc). Leave pricing/area fields blank where not yet known — they will simply not be shown publicly.',
        isSortable: true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Configuration Name',
          required: true,
          admin: {
            description: 'e.g. "1 BHK", "3 BHK", "Penthouse", "Retail Shop"',
          },
        },
        {
          name: 'carpetArea',
          type: 'number',
          label: 'Carpet Area',
        },
        {
          name: 'minArea',
          type: 'number',
          label: 'Min Area (if a range)',
        },
        {
          name: 'maxArea',
          type: 'number',
          label: 'Max Area (if a range)',
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
          name: 'startingPrice',
          type: 'number',
        },
        {
          name: 'maxPrice',
          type: 'number',
          label: 'Max Price (if applicable)',
        },
        {
          name: 'priceLabel',
          type: 'text',
          label: 'Price Label',
          admin: {
            description: 'Optional override, e.g. "Price on request" or "Starting from".',
          },
        },
        {
          name: 'availability',
          type: 'select',
          options: [
            { label: 'Available', value: 'available' },
            { label: 'Limited', value: 'limited' },
            { label: 'Sold Out', value: 'sold-out' },
          ],
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Additional Notes',
        },
      ],
    },

    {
      name: 'projectDetails',
      type: 'group',
      label: 'Project Details',
      fields: [
        {
          name: 'projectType',
          type: 'select',
          label: 'Project Type',
          options: [
            { label: 'Residential', value: 'residential' },
            { label: 'Commercial', value: 'commercial' },
            { label: 'Mixed Use', value: 'mixed-use' },
          ],
        },
        {
          name: 'propertyType',
          type: 'select',
          label: 'Property Type',
          options: [
            { label: 'Apartment', value: 'apartment' },
            { label: 'Villa', value: 'villa' },
            { label: 'Office', value: 'office' },
            { label: 'Shop', value: 'shop' },
            { label: 'Showroom', value: 'showroom' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'possessionStatus',
          type: 'select',
          label: 'Possession Status',
          options: [
            { label: 'Ready to Move', value: 'ready-to-move' },
            { label: 'Under Construction', value: 'under-construction' },
          ],
        },
        {
          name: 'possessionDate',
          type: 'date',
          label: 'Possession Date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
            description: 'Optional. Expected or actual possession month/year.',
          },
        },
        {
          name: 'constructionStatus',
          type: 'text',
          label: 'Construction Status',
          admin: {
            description: 'Free text, e.g. "5th slab completed" — optional detail beyond Possession Status.',
          },
        },
        {
          name: 'numberOfTowers',
          type: 'number',
          label: 'Number of Towers',
        },
        {
          name: 'numberOfFloors',
          type: 'number',
          label: 'Number of Floors',
        },
        {
          name: 'totalUnits',
          type: 'number',
          label: 'Total Units',
        },
        {
          name: 'parkingInfo',
          type: 'text',
          label: 'Parking Information',
        },
        {
          name: 'developerDescription',
          type: 'textarea',
          label: 'About the Developer',
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
      name: 'specifications',
      type: 'array',
      label: 'Specifications',
      labels: {
        singular: 'Specification',
        plural: 'Specifications',
      },
      admin: {
        description: 'e.g. "Flooring" / "Vitrified tiles", "Kitchen" / "Modular fittings".',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },

    {
      name: 'media',
      type: 'group',
      fields: [
        {
          name: 'featuredImage',
          type: 'upload',
          relationTo: 'media',
          filterOptions: filterMediaByFolder,
          admin: {
            description:
              'Hero image used on the project card and the top of the project page. Only media filed under this project\'s own folder can be selected.',
          },
        },
        {
          name: 'gallery',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          filterOptions: filterMediaByFolder,
          admin: {
            isSortable: true,
            description:
              'Additional project photos. Drag to reorder. Only media filed under this project\'s own folder can be selected.',
          },
        },
        {
          name: 'floorPlans',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          filterOptions: filterMediaByFolder,
          admin: {
            isSortable: true,
            description:
              'Floor plan images, one per configuration/layout as applicable. Only media filed under this project\'s own folder can be selected.',
          },
        },
        {
          name: 'masterPlan',
          type: 'upload',
          relationTo: 'media',
          filterOptions: filterMediaByFolder,
          admin: {
            description:
              'Overall project layout / master plan image. Only media filed under this project\'s own folder can be selected.',
          },
        },
        {
          name: 'locationMapImage',
          type: 'upload',
          relationTo: 'media',
          filterOptions: filterMediaByFolder,
          admin: {
            description:
              'Optional. A map/location image, if different from the master plan. Only media filed under this project\'s own folder can be selected.',
          },
        },
      ],
    },

    {
      name: 'source',
      type: 'group',
      label: 'Source & Audit (Internal)',
      admin: {
        description:
          'Internal tracking for drafts created via Brochure Convert. Never exposed on the public website or API.',
      },
      access: {
        read: isAuthenticatedField,
        create: isAuthenticatedField,
        update: isAuthenticatedField,
      },
      fields: [
        {
          name: 'sourceType',
          type: 'select',
          label: 'Source Type',
          options: [
            { label: 'PDF Brochure', value: 'pdf' },
            { label: 'Pasted Text', value: 'pasted-text' },
            { label: 'Manual Entry', value: 'manual' },
          ],
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'sourceFilename',
          type: 'text',
          label: 'Source Filename',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'processedAt',
          type: 'date',
          label: 'Processed At',
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'extractionVersion',
          type: 'text',
          label: 'Extraction Version',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'extractionNotes',
          type: 'textarea',
          label: 'Extraction Review Notes',
          admin: {
            description:
              'Auto-generated notes from Brochure Convert flagging fields that need manual review before publishing.',
          },
        },
      ],
    },
  ],
};
