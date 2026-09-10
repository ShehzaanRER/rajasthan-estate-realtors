import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext';
import { CATEGORY_LABELS } from '../nearby-locations/categories';
import type { ConnectionCategory } from '../nearby-locations/types';
import type { Amenity, Media, Project } from '../../payload-types';
import { toRelativeMediaUrl } from '../mediaUrl';
import { formatInrDisplay } from '../properties/formatPrice';
import { isPublicProjectStatus } from './publicScope';
import type {
  PublicProject,
  PublicProjectAmenity,
  PublicProjectConfiguration,
  PublicProjectConnection,
  PublicProjectImage,
  PublicProjectLocation,
  PublicProjectSpecification,
} from './types';

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Upcoming',
  'under-construction': 'Under Construction',
  'ready-to-move': 'Ready to Move',
  completed: 'Completed',
  'sold-out': 'Sold Out',
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  'mixed-use': 'Mixed Use',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  office: 'Office',
  shop: 'Shop',
  showroom: 'Showroom',
  other: 'Other',
};

const POSSESSION_LABELS: Record<string, string> = {
  'ready-to-move': 'Ready to Move',
  'under-construction': 'Under Construction',
};

function textOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

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

function mapDescription(description: Project['description']): { html: string | null; text: string | null } {
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

function toPublicImage(media: Media): PublicProjectImage {
  return {
    url: toRelativeMediaUrl(media.url as string),
    alt: media.alt,
    caption: media.caption?.trim() ? media.caption : null,
    width: typeof media.width === 'number' ? media.width : null,
    height: typeof media.height === 'number' ? media.height : null,
  };
}

function mapSingleImage(value: number | Media | null | undefined): PublicProjectImage | null {
  return isPopulatedMedia(value) ? toPublicImage(value) : null;
}

function mapImageList(values: (number | Media)[] | null | undefined): PublicProjectImage[] {
  const images: PublicProjectImage[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    if (!isPopulatedMedia(value)) {
      continue;
    }

    if (seen.has(value.url as string)) {
      continue;
    }

    seen.add(value.url as string);
    images.push(toPublicImage(value));
  }

  return images;
}

function uniqueJoin(parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const part of parts) {
    const value = textOrNull(part);
    if (!value) {
      continue;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    ordered.push(value);
  }

  return ordered.join(', ');
}

function mapLocation(location: Project['location'] | null | undefined): PublicProjectLocation | null {
  if (!location) {
    return null;
  }

  const locality = textOrNull(location.locality);
  const city = textOrNull(location.city);

  if (!locality || !city) {
    return null;
  }

  const locationDisplay = uniqueJoin([locality, location.area, city]);
  const address = textOrNull(location.address);

  return {
    address,
    locality,
    area: textOrNull(location.area),
    city,
    state: textOrNull(location.state),
    pincode: textOrNull(location.pincode),
    latitude: typeof location.latitude === 'number' && Number.isFinite(location.latitude) ? location.latitude : null,
    longitude:
      typeof location.longitude === 'number' && Number.isFinite(location.longitude) ? location.longitude : null,
    mapsQuery: address || locationDisplay,
    locationDisplay,
  };
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

function mapNearbyConnectivity(doc: Project): PublicProjectConnection[] {
  const connections = doc.nearbyConnectivity?.connections ?? [];
  const publicConnections: PublicProjectConnection[] = [];

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

function formatAreaValue(area: number, unit: string | null | undefined): string {
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(area);
  if (unit === 'sq-m') {
    return `${formatted} sq. m.`;
  }
  return `${formatted} sq. ft.`;
}

function mapConfigurations(
  values: NonNullable<Project['configurations']> | null | undefined,
): PublicProjectConfiguration[] {
  const configurations: PublicProjectConfiguration[] = [];

  for (const value of values ?? []) {
    const name = textOrNull(value?.name);
    if (!name) {
      continue;
    }

    let carpetAreaDisplay: string | null = null;
    if (typeof value.carpetArea === 'number' && value.carpetArea > 0) {
      carpetAreaDisplay = formatAreaValue(value.carpetArea, value.areaUnit);
    }

    let areaRangeDisplay: string | null = null;
    const hasMin = typeof value.minArea === 'number' && value.minArea > 0;
    const hasMax = typeof value.maxArea === 'number' && value.maxArea > 0;
    if (hasMin && hasMax) {
      areaRangeDisplay = `${formatAreaValue(value.minArea as number, value.areaUnit)} - ${formatAreaValue(value.maxArea as number, value.areaUnit)}`;
    } else if (hasMin) {
      areaRangeDisplay = `From ${formatAreaValue(value.minArea as number, value.areaUnit)}`;
    } else if (hasMax) {
      areaRangeDisplay = `Up to ${formatAreaValue(value.maxArea as number, value.areaUnit)}`;
    }

    const startingPriceDisplay =
      typeof value.startingPrice === 'number' && value.startingPrice > 0
        ? formatInrDisplay(value.startingPrice)
        : null;
    const maxPriceDisplay =
      typeof value.maxPrice === 'number' && value.maxPrice > 0 ? formatInrDisplay(value.maxPrice) : null;

    configurations.push({
      name,
      carpetAreaDisplay,
      areaRangeDisplay,
      startingPriceDisplay,
      maxPriceDisplay,
      priceLabel: textOrNull(value.priceLabel),
      availability: value.availability ?? null,
      notes: textOrNull(value.notes),
    });
  }

  return configurations;
}

function mapSpecifications(
  values: NonNullable<Project['specifications']> | null | undefined,
): PublicProjectSpecification[] {
  const specifications: PublicProjectSpecification[] = [];

  for (const value of values ?? []) {
    const label = textOrNull(value?.label);
    const specValue = textOrNull(value?.value);
    if (!label || !specValue) {
      continue;
    }

    specifications.push({ label, value: specValue });
  }

  return specifications;
}

function mapAmenities(values: Project['amenities'] | null | undefined): PublicProjectAmenity[] {
  const amenities: PublicProjectAmenity[] = [];

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

function mapHighlights(values: Project['highlights'] | null | undefined): string[] {
  const highlights: string[] = [];

  for (const value of values ?? []) {
    const text = textOrNull(value?.text);
    if (text) {
      highlights.push(text);
    }
  }

  return highlights;
}

function formatPossessionDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function resolveStartingPrice(configurations: PublicProjectConfiguration[]): string | null {
  for (const configuration of configurations) {
    if (configuration.startingPriceDisplay) {
      return configuration.startingPriceDisplay;
    }
  }

  return null;
}

export function mapProject(doc: Project | null | undefined): PublicProject | null {
  if (!doc) {
    return null;
  }

  const projectId = doc.projectId?.trim();
  const slug = doc.slug?.trim();
  const name = doc.name?.trim();
  const developer = doc.developer?.trim();

  if (!projectId || !slug || !name || !developer) {
    return null;
  }

  if (!isPublicProjectStatus(doc.status)) {
    return null;
  }

  const location = mapLocation(doc.location);
  if (!location) {
    return null;
  }

  const description = mapDescription(doc.description);
  const configurations = mapConfigurations(doc.configurations);
  const amenities = mapAmenities(doc.amenities);
  const projectDetails = doc.projectDetails;
  const gallery = mapImageList(doc.media?.gallery);
  const floorPlans = mapImageList(doc.media?.floorPlans);
  const featuredImage = mapSingleImage(doc.media?.featuredImage);
  const masterPlan = mapSingleImage(doc.media?.masterPlan);
  const locationMapImage = mapSingleImage(doc.media?.locationMapImage);

  const images: PublicProjectImage[] = [];
  const seenUrls = new Set<string>();
  for (const image of [featuredImage, ...gallery]) {
    if (image && !seenUrls.has(image.url)) {
      seenUrls.add(image.url);
      images.push(image);
    }
  }

  return {
    projectId,
    slug,
    name,
    developer,
    status: doc.status,
    statusLabel: STATUS_LABELS[doc.status] ?? doc.status,
    descriptionHtml: description.html,
    descriptionText: description.text,
    highlights: mapHighlights(doc.highlights),
    reraNumber: textOrNull(doc.legal?.reraNumber),
    reraInfo: textOrNull(doc.legal?.reraInfo),
    location,
    nearbyConnectivity: mapNearbyConnectivity(doc),
    configurations,
    startingPriceDisplay: resolveStartingPrice(configurations),
    projectType: projectDetails?.projectType ?? null,
    projectTypeLabel: projectDetails?.projectType ? PROJECT_TYPE_LABELS[projectDetails.projectType] ?? null : null,
    propertyType: projectDetails?.propertyType ?? null,
    propertyTypeLabel: projectDetails?.propertyType ? PROPERTY_TYPE_LABELS[projectDetails.propertyType] ?? null : null,
    possessionStatus: projectDetails?.possessionStatus ?? null,
    possessionStatusLabel: projectDetails?.possessionStatus ? POSSESSION_LABELS[projectDetails.possessionStatus] : null,
    possessionDateDisplay: formatPossessionDate(projectDetails?.possessionDate),
    constructionStatus: textOrNull(projectDetails?.constructionStatus),
    numberOfTowers: typeof projectDetails?.numberOfTowers === 'number' ? projectDetails.numberOfTowers : null,
    numberOfFloors: typeof projectDetails?.numberOfFloors === 'number' ? projectDetails.numberOfFloors : null,
    totalUnits: typeof projectDetails?.totalUnits === 'number' ? projectDetails.totalUnits : null,
    parkingInfo: textOrNull(projectDetails?.parkingInfo),
    developerDescription: textOrNull(projectDetails?.developerDescription),
    amenities,
    amenityNames: amenities.map((amenity) => amenity.name),
    specifications: mapSpecifications(doc.specifications),
    featuredImage,
    gallery,
    floorPlans,
    masterPlan,
    locationMapImage,
    images,
  };
}
