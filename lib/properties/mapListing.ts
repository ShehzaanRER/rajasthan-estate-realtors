import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext';
import { CATEGORY_LABELS } from '../nearby-locations/categories';
import type { ConnectionCategory } from '../nearby-locations/types';
import type { Amenity, Listing, Media, Property } from '../../payload-types';
import { isListingLevelTag } from '../listings/vocabulary';
import { toDeliveryImage } from '../mediaUrl';
import { formatAreaDisplay, formatLocationDisplay, mapPublicLocation } from './formatLocation';
import { formatInrDisplay, mapPricing } from './formatPrice';
import { isPublicStatus } from './publicScope';
import type {
  PublicAmenity,
  PublicConnection,
  PublicImage,
  PublicListingLink,
  PublicProperty,
} from './types';

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

const PURPOSE_LABELS: Record<Listing['transactionType'], string> = {
  sale: 'Sale',
  rent: 'Rent',
  lease: 'Lease',
};

const PURPOSE_BADGE_FALLBACK: Record<Listing['transactionType'], string> = {
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
  const delivery = toDeliveryImage(media);

  return {
    url: delivery.url,
    alt: media.alt,
    caption: media.caption?.trim() ? media.caption : null,
    width: delivery.width,
    height: delivery.height,
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

function resolveBadge(tags: PublicProperty['tags'], purpose: Listing['transactionType']): string {
  for (const tag of BADGE_TAG_ORDER) {
    if (tags.includes(tag)) {
      return BADGE_TAG_LABELS[tag];
    }
  }

  return PURPOSE_BADGE_FALLBACK[purpose];
}

/** Label for a sibling-listing link ("Rent"), shared with the data layer. */
export function purposeLabelFor(purpose: Listing['transactionType']): string {
  return PURPOSE_LABELS[purpose];
}

/**
 * Turns a populated sibling listing into the link shown beside the main one.
 * Returns null for anything that is not a public, fully identified listing.
 */
export function mapListingLink(listing: Listing | null | undefined): PublicListingLink | null {
  if (!listing || !isPublicStatus(listing.status)) {
    return null;
  }

  const listingId = listing.listingId?.trim();
  const slug = listing.slug?.trim();
  if (!listingId || !slug) {
    return null;
  }

  return {
    listingId,
    slug,
    purpose: listing.transactionType,
    purposeLabel: PURPOSE_LABELS[listing.transactionType],
    displayPrice: mapPricing(listing.transactionType, listing.pricing).displayPrice,
  };
}

/**
 * The only place a CMS Listing (with its parent Property populated) becomes
 * what the public site renders.
 *
 * Shared, physical facts — address, specifications, photographs, amenities —
 * come from the property; the transaction — type, price, terms, status, URL,
 * marketing tags — comes from the listing. A listing whose property is not
 * populated (a bare id means the property was not readable to this visitor) or
 * that is not public maps to null, so nothing half-visible can reach a page.
 */
export function mapListing(
  listing: Listing | null | undefined,
  options: { otherListings?: PublicListingLink[] } = {},
): PublicProperty | null {
  if (!listing) {
    return null;
  }

  const doc = listing.property;
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const listingId = listing.listingId?.trim();
  const propertyId = doc.propertyId?.trim();
  const slug = listing.slug?.trim();
  const title = doc.title?.trim();

  if (!listingId || !propertyId || !slug || !title) {
    return null;
  }

  if (!isPublicStatus(listing.status)) {
    return null;
  }

  const location = mapPublicLocation(doc.location);
  if (!location) {
    return null;
  }

  const purpose = listing.transactionType;
  // Listing tags drive the badge and "featured"; only the property-level tags
  // that describe the unit itself are carried over, so a legacy `featured` left
  // on the property never features a listing it was not set on.
  const tags = [...(listing.tags ?? []), ...(doc.tags ?? []).filter((tag) => !isListingLevelTag(tag))];
  const pricing = mapPricing(purpose, listing.pricing);
  const amenities = mapAmenities(doc.amenities);
  const description = mapDescription(doc.description);
  // Carpet Area is the precise, preferred figure; Built-up Area is the
  // fallback when only that was recorded (mirrors the CSV import's own
  // carpet-preferred-over-built-up ordering — see scripts/import-properties.ts).
  const areaDisplay =
    doc.details?.carpetArea != null
      ? formatAreaDisplay(doc.details.carpetArea, doc.details.carpetAreaUnit)
      : formatAreaDisplay(doc.details?.builtUpArea, doc.details?.builtUpAreaUnit);
  const category = doc.propertyCategory ?? null;
  const categoryLabel = category ? CATEGORY_LABELS_MAP[category] : null;
  const propertyTypeLabel = PROPERTY_TYPE_LABELS[doc.propertyType];
  const locationDisplay = formatLocationDisplay(doc.location);

  return {
    propertyId,
    listingId,
    otherListings: (options.otherListings ?? []).filter((other) => other.listingId !== listingId),
    slug,
    title,
    descriptionHtml: description.html,
    descriptionText: description.text,
    purpose,
    purposeLabel: PURPOSE_LABELS[purpose],
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
    badge: resolveBadge(tags, purpose),
    status: listing.status,
    statusLabel: STATUS_LABELS[listing.status],
    tags,
    featured: tags.includes('featured'),
    nearbyConnectivity: mapNearbyConnectivity(doc),
  };
}
