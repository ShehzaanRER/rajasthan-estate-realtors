import type { Access, CollectionConfig } from 'payload';

const isAuthenticated: Access = ({ req: { user } }) => Boolean(user);

/**
 * Locked down at the Payload layer: nobody can create, read, update or
 * delete via the REST/GraphQL/Local API without an authenticated admin
 * session. Public submissions do NOT go through Payload's own access
 * control — they go through the validated `/api/contact` route handler
 * (see app/api/contact/route.ts), which uses the Local API with
 * `overrideAccess: true` after its own validation, honeypot and
 * minimum-time-on-page checks. This keeps the only public write path
 * app-controlled rather than opening a public Payload create endpoint.
 */
export const ContactInquiries: CollectionConfig = {
  slug: 'contact-inquiries',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'requirement', 'status', 'createdAt'],
    description: 'Submissions from the public Contact form. Not publicly readable.',
  },

  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'text',
    },
    {
      name: 'requirement',
      type: 'select',
      required: true,
      options: [
        { label: 'Buy Property', value: 'buy-property' },
        { label: 'Rent Property', value: 'rent-property' },
        { label: 'Sell Property', value: 'sell-property' },
        { label: 'New Project', value: 'new-project' },
        { label: 'Commercial Property', value: 'commercial-property' },
        { label: 'General Enquiry', value: 'general-enquiry' },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'source',
      type: 'text',
      label: 'Source Page',
      admin: {
        readOnly: true,
        description: 'The page the enquiry was submitted from.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        description: 'Internal admin field, not set by the public form.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'Internal admin field, not set by the public form.',
      },
    },
  ],
};
