import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext';
import { CATEGORY_LABELS } from '../nearby-locations/categories';
import type { ConnectionCategory } from '../nearby-locations/types';
import type { Amenity, Media, Property } from '../../payload-types';
import { SITE_URL } from '../siteConfig';
import { formatAreaDisplay, formatLocationDisplay, mapPublicLocation } from './formatLocation';
import { formatInrDisplay, mapPricing } from './formatPrice';
import { isPublicStatus } from './publicScope';
import type { PublicAmenity, PublicConnection, PublicImage, PublicProperty } from './types';

/**
 * Payload's `serverURL` config (needed for the admin panel/API) makes it emit
 * fully-qualified media URLs. Converting back to a relative path here means
 * next/image and the browser fetch these from this same app directly,
 * instead of the server making a self-referential external HTTP request to
 * its own public domain to optimize its own images.
 */
function toRelativeMediaUrl(url: string): string {
  if (url.startsWith(SITE_URL)) {
    return url.slice(SITE_URL.length) || '/';
  }

  return url;
}

const PROPERTY_TYPE_LABELS: Record<Property['propertyType'], string> = {
  apartment: 'Apartment',
  house: 'House',
  villa: 'Villa',
  office: 'Office',
  shop: 'Shop',
  showroom: 'Showroom',
  warehouse: 'Warehouse',
  land: 'Land',
  other: 'Other',
};

const PURPOSE_LABELS: Record<Property['purpose'], string> = {
  sale: 'Sale',
  rent: 'Rent',
  lease: 'Lease',
};

const PURPOSE_BADGE_FALLBACK: Record<Property['purpose'], string> = {
  sale: 'For Sale',
  rent: 'For Rent',
  lease: 'For Lease',
};

const CATEGORY_LABELS_MAP: Record<NonNullable<Property['propertyCategory']>, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
};

const STATUS_LABELS: Record<'available' | 'under-offer', string> = {
  available: 'Available',
  'under-offer': 'Under offer',
};

const BADGE_TAG_ORDER = ['new', 'premium', 'price-reduced', 'new-development'] as const;

const BADGE_TAG_LABELS: Record<(typeof BADGE_TAG_ORDER)[number], string> = {
  new: 'New',
  premium: 'Premium',
  'price-reduced': 'Price Reduced',
  'new-development': 'New Development',
};

const FURNISHING_LABELS: Record<NonNullable<NonNullable<Property['details']>['furnishing']>, string> = {
  unfurnished: 'Unfurnished',
  'semi-furnished': 'Semi-furnished',
  furnished: 'Furnished',
};

const POSSESSION_LABELS: Record<NonNullable<NonNullable<Property['details']>['possessionStatus']>, string> = {
  'ready-to-move': 'Ready to Move',
  'under-construction': 'Under Construction',
};

const FIT_OUT_LABELS: Record<NonNullable<NonNullable<Property['details']>['fitOutStatus']>, string> = {
  'bare-shell': 'Bare Shell',
  'warm-shell': 'Warm Shell',
  fitted: 'Fitted',
};

function isPopulatedMedia(value: number | Media | null | undefined): value is Media {
  return Boolean(value) && typeof value === 'object' && typeof value.url === 'string' && value.url.length > 0;
}

function isPopulatedAmenity(value: number | Amenity): value is Amenity {
  return typeof value === 'object' && typeof value.name === 'string' && typeof value.slug === 'string';
}

function isLexicalState(value: unknown): value is { root: { type: string; children: unknown[] } } {
  if (!value || typeof value !== 'object' || !('root' in value)) {
    return false;
  }

  const root = (value as { root?: unknown }).root;
  return Boolean(root && typeof root === 'object' && 'type' in root && 'children' in root);
}

function mapDescription(description: Property['description']): { html: string | null; text: string | null } {
  if (!isLexicalState(description)) {
    return { html: null, text: null };
  }

  let html: string | null = null;
  let text: string | null = null;

  try {
    const converted = convertLexicalToHTML({
      data: description as Parameters<typeof convertLexicalToHTML>[0]['data'],
      disableContainer: true,
    }).trim();
    html = converted.length > 0 ? converted : null;
  } catch {
    html = null;
  }

  try {
    const converted = convertLexicalToPlaintext({
      data: description as Parameters<typeof convertLexicalToPlaintext>[0]['data'],
    }).trim();
    text = converted.length > 0 ? converted : null;
  } catch {
    text = null;
  }

  return { html, text };
}

function toPublicImage(media: Media): PublicImage {
  return {
    url: toRelativeMediaUrl(media.url as string),
    alt: media.alt,
    caption: media.caption?.trim() ? media.caption : null,
    width: typeof media.width === 'number' ? media.width : null,
    height: typeof media.height === 'number' ? media.height : null,
  };
}

function mapImages(media: Property['media'] | null | undefined): PublicImage[] {
  const images: PublicImage[] = [];
  const seen = new Set<string>();

  const push = (value: number | Media | null | undefined) => {
    if (!isPopulatedMedia(value)) {
      return;
    }

    if (seen.has(value.url as string)) {
      return;
    }

    seen.add(value.url as string);
    images.push(toPublicImage(value));
  };

  push(media?.featuredImage);

  for (const item of media?.gallery ?? []) {
    push(item);
  }

  return images;
}

function mapAmenities(values: Property['amenities'] | null | undefined): PublicAmenity[] {
  const amenities: PublicAmenity[] = [];

  for (const value of values ?? []) {
    if (!isPopulatedAmenity(value)) {
      continue;
    }

    amenities.push({
      name: value.name,
      slug: value.slug,
      category: value.category ?? null,
    });
  }

  return amenities;
}

function formatTravelTime(minutes: number): string {
  return `${minutes} min`;
}

function formatDistance(distance: number, unit: 'km' | 'm' | null): string {
  if (unit === 'km') {
    return `${distance} km`;
  }

  if (unit === 'm') {
    return `${distance} m`;
  }

  return String(distance);
}

function mapNearbyConnectivity(doc: Property): PublicConnection[] {
  const connections = doc.nearbyConnectivity?.connections ?? [];
  const publicConnections: PublicConnection[] = [];

  for (const connection of connections) {
    if (!connection || connection.displayOnWebsite !== true) {
      continue;
    }

    const name = connection.name?.trim();
    if (!name) {
      continue;
    }

    const category = connection.category as ConnectionCategory;
    const travelTimeMinutes =
      typeof connection.travelTimeMinutes === 'number' && Number.isFinite(connection.travelTimeMinutes)
        ? connection.travelTimeMinutes
        : null;
    const distance =
      typeof connection.distance === 'number' && Number.isFinite(connection.distance) ? connection.distance : null;
    const distanceUnit = connection.distanceUnit === 'km' || connection.distanceUnit === 'm' ? connection.distanceUnit : null;

    publicConnections.push({
      name,
      category,
      categoryLabel: CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other,
      travelTimeMinutes,
      travelTimeDisplay: travelTimeMinutes == null ? null : formatTravelTime(travelTimeMinutes),
      distance,
      distanceUnit,
      distanceDisplay: distance == null ? null : formatDistance(distance, distanceUnit),
    });
  }

  return publicConnections;
}

function pushRow(rows: { label: string; value: string }[], label: string, value: string | null | undefined) {
  if (!value) {
    return;
  }

  rows.push({ label, value });
}

function yesNo(value: boolean | null | undefined): string | null {
  if (typeof value !== 'boolean') {
    return null;
  }

  return value ? 'Yes' : 'No';
}

function buildDetailsRows(doc: Property, options: {
  categoryLabel: string | null;
  propertyTypeLabel: string;
  locationDisplay: string;
  areaDisplay: string | null;
  pricing: ReturnType<typeof mapPricing>;
}): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const details = doc.details;
  const building = doc.buildingDetails;

  const propertyTypeValue = [options.categoryLabel, options.propertyTypeLabel].filter(Boolean).join(' ');
  pushRow(rows, 'Property Type', propertyTypeValue || null);

  if (typeof details?.bedrooms === 'number') {
    pushRow(rows, 'Configuration', `${details.bedrooms} BHK`);
  }

  pushRow(rows, 'Area', options.areaDisplay);

  if (typeof details?.bathrooms === 'number') {
    pushRow(rows, 'Bathrooms', String(details.bathrooms));
  }

  if (typeof details?.balconies === 'number') {
    pushRow(rows, 'Balconies', String(details.balconies));
  }

  if (details?.furnishing) {
    pushRow(rows, 'Furnishing', FURNISHING_LABELS[details.furnishing]);
  }

  if (typeof details?.propertyAge === 'number') {
    pushRow(rows, 'Property Age', `${details.propertyAge} ${details.propertyAge === 1 ? 'year' : 'years'}`);
  }

  if (details?.possessionStatus) {
    pushRow(rows, 'Possession Status', POSSESSION_LABELS[details.possessionStatus]);
  }

  if (typeof details?.cabins === 'number') {
    pushRow(rows, 'Cabins', String(details.cabins));
  }

  if (typeof details?.workstations === 'number') {
    pushRow(rows, 'Workstations', String(details.workstations));
  }

  if (typeof details?.meetingRooms === 'number') {
    pushRow(rows, 'Meeting Rooms', String(details.meetingRooms));
  }

  if (doc.propertyCategory === 'commercial' || details?.pantryAvailable === true) {
    pushRow(rows, 'Pantry Available', yesNo(details?.pantryAvailable));
  }

  if (details?.fitOutStatus) {
    pushRow(rows, 'Fit-out Status', FIT_OUT_LABELS[details.fitOutStatus]);
  }

  pushRow(rows, 'Building Name', building?.buildingName?.trim() || null);

  if (typeof building?.floorNumber === 'number') {
    pushRow(rows, 'Floor', String(building.floorNumber));
  }

  if (typeof building?.totalFloors === 'number') {
    pushRow(rows, 'Total Floors', String(building.totalFloors));
  }

  pushRow(rows, 'Lift Available', yesNo(building?.liftAvailable));
  pushRow(rows, 'Location', options.locationDisplay || null);

  if (options.pricing.pricePerSqFt) {
    const formatted = formatInrDisplay(options.pricing.pricePerSqFt);
    pushRow(rows, 'Price per sq. ft.', formatted);
  }

  if (options.pricing.additionalCharges) {
    pushRow(rows, 'Additional Charges', formatInrDisplay(options.pricing.additionalCharges));
  }

  if (options.pricing.securityDeposit) {
    pushRow(rows, 'Security Deposit', formatInrDisplay(options.pricing.securityDeposit));
  }

  if (options.pricing.maintenanceCharges) {
    pushRow(rows, 'Maintenance Charges', formatInrDisplay(options.pricing.maintenanceCharges));
  }

  if (options.pricing.maintenanceIncluded) {
    pushRow(rows, 'Maintenance Included', 'Yes');
  }

  if (options.pricing.brokerageFee) {
    pushRow(rows, 'Brokerage Fee', formatInrDisplay(options.pricing.brokerageFee));
  }

  if (options.pricing.negotiable) {
    pushRow(rows, 'Negotiable', 'Yes');
  }

  return rows;
}

function resolveBadge(tags: NonNullable<Property['tags']>, purpose: Property['purpose']): string {
  for (const tag of BADGE_TAG_ORDER) {
    if (tags.includes(tag)) {
      return BADGE_TAG_LABELS[tag];
    }
  }

  return PURPOSE_BADGE_FALLBACK[purpose];
}

export function mapProperty(doc: Property | null | undefined): PublicProperty | null {
  if (!doc) {
    return null;
  }

  const propertyId = doc.propertyId?.trim();
  const slug = doc.slug?.trim();
  const title = doc.title?.trim();

  if (!propertyId || !slug || !title) {
    return null;
  }

  if (!isPublicStatus(doc.status)) {
    return null;
  }

  const location = mapPublicLocation(doc.location);
  if (!location) {
    return null;
  }

  const tags = doc.tags ?? [];
  const pricing = mapPricing(doc.purpose, doc.pricing);
  const amenities = mapAmenities(doc.amenities);
  const description = mapDescription(doc.description);
  const areaDisplay = formatAreaDisplay(doc.details?.area, doc.details?.areaUnit);
  const category = doc.propertyCategory ?? null;
  const categoryLabel = category ? CATEGORY_LABELS_MAP[category] : null;
  const propertyTypeLabel = PROPERTY_TYPE_LABELS[doc.propertyType];
  const locationDisplay = formatLocationDisplay(doc.location);

  return {
    propertyId,
    slug,
    title,
    descriptionHtml: description.html,
    descriptionText: description.text,
    purpose: doc.purpose,
    purposeLabel: PURPOSE_LABELS[doc.purpose],
    category,
    categoryLabel,
    propertyType: doc.propertyType,
    propertyTypeLabel,
    locationDisplay,
    location,
    pricing,
    areaDisplay,
    bedrooms: typeof doc.details?.bedrooms === 'number' ? doc.details.bedrooms : null,
    bathrooms: typeof doc.details?.bathrooms === 'number' ? doc.details.bathrooms : null,
    details: doc.details ?? {},
    buildingDetails: {
      buildingName: doc.buildingDetails?.buildingName?.trim() || null,
      totalFloors: typeof doc.buildingDetails?.totalFloors === 'number' ? doc.buildingDetails.totalFloors : null,
      floorNumber: typeof doc.buildingDetails?.floorNumber === 'number' ? doc.buildingDetails.floorNumber : null,
      liftAvailable: typeof doc.buildingDetails?.liftAvailable === 'boolean' ? doc.buildingDetails.liftAvailable : null,
    },
    detailsRows: buildDetailsRows(doc, {
      categoryLabel,
      propertyTypeLabel,
      locationDisplay,
      areaDisplay,
      pricing,
    }),
    amenities,
    amenityNames: amenities.map((amenity) => amenity.name),
    images: mapImages(doc.media),
    badge: resolveBadge(tags, doc.purpose),
    status: doc.status,
    statusLabel: STATUS_LABELS[doc.status],
    tags,
    featured: tags.includes('featured'),
    nearbyConnectivity: mapNearbyConnectivity(doc),
  };
}
