import type { Amenity, Project } from '../../payload-types';
import type { PublicProjectStatus } from './publicScope';

export type PublicProjectImage = {
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export type PublicProjectAmenity = {
  name: string;
  slug: string;
  category: NonNullable<Amenity['category']> | null;
};

export type PublicProjectConnection = {
  name: string;
  category: NonNullable<
    NonNullable<NonNullable<Project['nearbyConnectivity']>['connections']>[number]['category']
  >;
  categoryLabel: string;
  travelTimeMinutes: number | null;
  travelTimeDisplay: string | null;
  distance: number | null;
  distanceUnit: 'km' | 'm' | null;
  distanceDisplay: string | null;
};

export type PublicProjectLocation = {
  address: string | null;
  locality: string;
  area: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsQuery: string;
  locationDisplay: string;
};

export type PublicProjectConfiguration = {
  name: string;
  carpetAreaDisplay: string | null;
  areaRangeDisplay: string | null;
  startingPriceDisplay: string | null;
  maxPriceDisplay: string | null;
  priceLabel: string | null;
  availability: 'available' | 'limited' | 'sold-out' | null;
  notes: string | null;
};

export type PublicProjectSpecification = {
  label: string;
  value: string;
};

export type PublicProject = {
  projectId: string;
  slug: string;
  name: string;
  developer: string;
  status: PublicProjectStatus;
  statusLabel: string;
  descriptionHtml: string | null;
  descriptionText: string | null;
  highlights: string[];
  reraNumber: string | null;
  reraInfo: string | null;
  location: PublicProjectLocation;
  nearbyConnectivity: PublicProjectConnection[];
  configurations: PublicProjectConfiguration[];
  startingPriceDisplay: string | null;
  projectType: NonNullable<NonNullable<Project['projectDetails']>['projectType']> | null;
  projectTypeLabel: string | null;
  propertyType: NonNullable<NonNullable<Project['projectDetails']>['propertyType']> | null;
  propertyTypeLabel: string | null;
  possessionStatus: 'ready-to-move' | 'under-construction' | null;
  possessionStatusLabel: string | null;
  possessionDateDisplay: string | null;
  constructionStatus: string | null;
  numberOfTowers: number | null;
  numberOfFloors: number | null;
  totalUnits: number | null;
  parkingInfo: string | null;
  developerDescription: string | null;
  amenities: PublicProjectAmenity[];
  amenityNames: string[];
  specifications: PublicProjectSpecification[];
  featuredImage: PublicProjectImage | null;
  gallery: PublicProjectImage[];
  floorPlans: PublicProjectImage[];
  masterPlan: PublicProjectImage | null;
  locationMapImage: PublicProjectImage | null;
  images: PublicProjectImage[];
};
