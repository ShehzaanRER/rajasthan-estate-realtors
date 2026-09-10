import type { Amenity, Property } from '../../payload-types';
import type { PublicPropertyStatus } from './publicScope';

export type PublicImage = {
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

export type PublicAmenity = {
  name: string;
  slug: string;
  category: NonNullable<Amenity['category']> | null;
};

export type PublicConnection = {
  name: string;
  category: NonNullable<
    NonNullable<NonNullable<Property['nearbyConnectivity']>['connections']>[number]['category']
  >;
  categoryLabel: string;
  travelTimeMinutes: number | null;
  travelTimeDisplay: string | null;
  distance: number | null;
  distanceUnit: 'km' | 'm' | null;
  distanceDisplay: string | null;
};

export type PublicLocation = {
  locality: string;
  area: string | null;
  city: string;
  state: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsQuery: string;
};

export type PublicPricing = {
  currency: 'INR';
  priceOnRequest: boolean;
  negotiable: boolean;
  displayPrice: string;
  primaryAmount: number | null;
  rentPeriod: 'monthly' | 'quarterly' | 'yearly' | null;
  pricePerSqFt: number | null;
  additionalCharges: number | null;
  securityDeposit: number | null;
  maintenanceCharges: number | null;
  maintenanceIncluded: boolean;
  brokerageFee: number | null;
  totalLeaseAmount: number | null;
  monthlyLeasePayment: number | null;
};

export type PublicBuildingDetails = {
  buildingName: string | null;
  totalFloors: number | null;
  floorNumber: number | null;
  liftAvailable: boolean | null;
};

export type PublicProperty = {
  propertyId: string;
  slug: string;
  title: string;
  descriptionHtml: string | null;
  descriptionText: string | null;
  purpose: Property['purpose'];
  purposeLabel: string;
  category: NonNullable<Property['propertyCategory']> | null;
  categoryLabel: string | null;
  propertyType: Property['propertyType'];
  propertyTypeLabel: string;
  locationDisplay: string;
  location: PublicLocation;
  pricing: PublicPricing;
  areaDisplay: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  details: NonNullable<Property['details']>;
  buildingDetails: PublicBuildingDetails;
  detailsRows: { label: string; value: string }[];
  amenities: PublicAmenity[];
  amenityNames: string[];
  images: PublicImage[];
  badge: string;
  status: PublicPropertyStatus;
  statusLabel: string;
  tags: NonNullable<Property['tags']>;
  featured: boolean;
  nearbyConnectivity: PublicConnection[];
};
