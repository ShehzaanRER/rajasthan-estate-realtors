import type { AttentionCheck } from './types';

/**
 * The Needs Attention checklist.
 *
 * Every entry is a real gap in the existing schema, expressed as a `Where`
 * that is both counted and linked (see `types.ts`). Two rules kept this list
 * honest and should keep it that way:
 *
 * 1. **Only optional fields.** A required field cannot be blank on a saved
 *    record, so "missing title" / "missing locality" / "missing developer"
 *    are not checks — they are impossible states. Every field below is one
 *    Payload lets staff leave empty.
 * 2. **No status scoping.** Checks run across every record regardless of
 *    status. A draft with gaps is still a draft with gaps, and RER's rented
 *    inventory is actively managed even though it is not public — filtering
 *    to "public only" would hide exactly the records staff work on most.
 *
 * `severity: 'high'` is reserved for gaps that either damage a listing the
 * moment it goes public (image, price) or block operational follow-up
 * (owner contact, renewal dates). Everything else is completeness.
 */

const PROPERTY_CHECKS: AttentionCheck[] = [
  {
    key: 'property-featured-image',
    collection: 'properties',
    label: 'Properties missing a featured image',
    detail: 'The card image every listing grid and share preview uses.',
    severity: 'high',
    where: { 'media.featuredImage': { exists: false } },
  },
  {
    /**
     * Purpose-aware, because the amount lives in a different field per
     * transaction type — the same mapping `getProperties()` uses for budget
     * filtering (sale → price, rent → rentAmount, lease → monthlyLeasePayment).
     * A property explicitly marked Price on Request is not a gap.
     */
    key: 'property-price',
    collection: 'properties',
    label: 'Properties with no price for their transaction type',
    detail: 'Sale needs Price, Rent needs Rent Amount, Lease needs Monthly Lease Payment.',
    severity: 'high',
    where: {
      and: [
        { 'pricing.priceOnRequest': { not_equals: true } },
        {
          or: [
            { and: [{ purpose: { equals: 'sale' } }, { 'pricing.price': { exists: false } }] },
            { and: [{ purpose: { equals: 'rent' } }, { 'pricing.rentAmount': { exists: false } }] },
            { and: [{ purpose: { equals: 'lease' } }, { 'pricing.monthlyLeasePayment': { exists: false } }] },
          ],
        },
      ],
    },
  },
  {
    key: 'property-owner-contact',
    collection: 'properties',
    label: 'Properties missing an owner contact number',
    detail: 'No way to reach the owner for a renewal, viewing or offer.',
    severity: 'high',
    where: { 'ownerDetails.ownerContact': { exists: false } },
  },
  {
    key: 'property-rented-no-history',
    collection: 'properties',
    label: 'Rented properties with no tenancy recorded',
    detail: 'Status says rented, but there is no Tenancy History entry to renew against.',
    severity: 'high',
    where: {
      and: [{ status: { equals: 'rented' } }, { 'rentHistory.licenseeName': { exists: false } }],
    },
  },
  {
    key: 'property-rented-no-end-date',
    collection: 'properties',
    label: 'Rented properties with no agreement end date',
    detail: 'The current tenancy is missing a start date or term, so no renewal date can be calculated.',
    severity: 'high',
    where: {
      and: [{ status: { equals: 'rented' } }, { currentAgreementEndDate: { exists: false } }],
    },
  },
  {
    key: 'property-owner-name',
    collection: 'properties',
    label: 'Properties missing an owner name',
    detail: 'Owner Details tab.',
    severity: 'normal',
    where: { 'ownerDetails.ownerName': { exists: false } },
  },
  {
    key: 'property-gallery',
    collection: 'properties',
    label: 'Properties with no gallery images',
    detail: 'The detail page has nothing to show beyond the featured image.',
    severity: 'normal',
    where: { 'media.gallery': { exists: false } },
  },
  {
    key: 'property-description',
    collection: 'properties',
    label: 'Properties with no description',
    detail: 'Used by the detail page and by search engines.',
    severity: 'normal',
    where: { description: { exists: false } },
  },
  {
    key: 'property-category',
    collection: 'properties',
    label: 'Properties with no category set',
    detail: 'Residential or Commercial — drives listing filters.',
    severity: 'normal',
    where: { propertyCategory: { exists: false } },
  },
  {
    key: 'property-area',
    collection: 'properties',
    label: 'Properties with no area recorded',
    detail: 'Neither Carpet Area nor Built-up Area is set. Buyers and tenants filter on it.',
    severity: 'normal',
    where: {
      and: [{ 'details.carpetArea': { exists: false } }, { 'details.builtUpArea': { exists: false } }],
    },
  },
  {
    key: 'property-amenities',
    collection: 'properties',
    label: 'Properties with no amenities linked',
    detail: 'Nothing from the shared amenity list is attached.',
    severity: 'normal',
    where: { amenities: { exists: false } },
  },
];

const PROJECT_CHECKS: AttentionCheck[] = [
  {
    key: 'project-featured-image',
    collection: 'projects',
    label: 'Projects missing a featured image',
    detail: 'The card image every project grid and share preview uses.',
    severity: 'high',
    where: { 'media.featuredImage': { exists: false } },
  },
  {
    key: 'project-rera',
    collection: 'projects',
    label: 'Projects missing a RERA registration number',
    detail: 'Legal tab. Expected on any project marketed publicly.',
    severity: 'high',
    where: { 'legal.reraNumber': { exists: false } },
  },
  {
    key: 'project-configurations',
    collection: 'projects',
    label: 'Projects with no configurations',
    detail: 'A project carries its pricing and sizes here — with none, it shows neither.',
    severity: 'high',
    where: { 'configurations.name': { exists: false } },
  },
  {
    key: 'project-gallery',
    collection: 'projects',
    label: 'Projects with no gallery images',
    detail: 'The detail page has nothing to show beyond the featured image.',
    severity: 'normal',
    where: { 'media.gallery': { exists: false } },
  },
  {
    key: 'project-possession-date',
    collection: 'projects',
    label: 'Projects with no possession date',
    detail: 'Project Details tab. The first thing buyers ask about.',
    severity: 'normal',
    where: { 'projectDetails.possessionDate': { exists: false } },
  },
];

export const ATTENTION_CHECKS: AttentionCheck[] = [...PROPERTY_CHECKS, ...PROJECT_CHECKS];
