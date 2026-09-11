/**
 * Structured project data schema for Brochure Convert. Deliberately separate
 * from the Project collection schema (collections/Projects.ts) — this is the
 * exact JSON contract the admin pastes in (produced externally by the RER
 * Claude Skill) and what gets validated before any of it touches a real
 * Project record. RER Project Number is never part of this shape; it is
 * always assigned by the existing assignProjectId hook, and status is never
 * read from it — createDraftProject always forces 'draft'.
 */

export type ExtractedAreaUnit = 'sq-ft' | 'sq-m';

export type ExtractedProjectType = 'residential' | 'commercial' | 'mixed-use';

export type ExtractedPropertyType = 'apartment' | 'villa' | 'office' | 'shop' | 'showroom' | 'other';

export type ExtractedPossessionStatus = 'ready-to-move' | 'under-construction';

export type ExtractedAvailability = 'available' | 'limited' | 'sold-out';

export type ExtractedConfiguration = {
  name: string | null;
  carpetArea: number | null;
  minArea: number | null;
  maxArea: number | null;
  areaUnit: ExtractedAreaUnit | null;
  /** Only set when the source states a single unambiguous absolute figure. */
  startingPrice: number | null;
  maxPrice: number | null;
  /** Verbatim price wording when the source is a range, "onwards", "approx", or otherwise non-numeric. */
  priceLabel: string | null;
  notes: string | null;
  availability: ExtractedAvailability | null;
};

/** Matches collections/Projects.ts nearbyConnectivity.connections[].category options exactly. */
export type ExtractedConnectionCategory =
  | 'transport'
  | 'metro'
  | 'railway-station'
  | 'airport'
  | 'road-highway'
  | 'school'
  | 'college'
  | 'hospital'
  | 'shopping'
  | 'restaurant'
  | 'business-district'
  | 'park'
  | 'religious-place'
  | 'other';

export type ExtractedConnection = {
  name: string | null;
  category: ExtractedConnectionCategory | null;
  travelTimeMinutes: number | null;
  distance: number | null;
  distanceUnit: 'km' | 'm' | null;
};

export type ExtractedSpecification = {
  label: string;
  value: string;
};

export type ExtractedProjectDetails = {
  projectType: ExtractedProjectType | null;
  propertyType: ExtractedPropertyType | null;
  possessionStatus: ExtractedPossessionStatus | null;
  /** Free text as found in the source (e.g. "December 2027") — never coerced into a date. */
  possessionDate: string | null;
  constructionStatus: string | null;
  numberOfTowers: number | null;
  numberOfFloors: number | null;
  totalUnits: number | null;
  parkingInfo: string | null;
  developerDescription: string | null;
};

export type ExtractedProjectData = {
  name: string | null;
  developer: string | null;
  location: {
    address: string | null;
    locality: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  };
  legal: {
    reraNumber: string | null;
    reraInfo: string | null;
  };
  /** Plain text, converted to a minimal Lexical document on draft creation. */
  description: string | null;
  highlights: string[];
  configurations: ExtractedConfiguration[];
  projectDetails: ExtractedProjectDetails;
  /** Raw amenity names/phrases as found in the source — matched, never auto-created. */
  amenities: string[];
  specifications: ExtractedSpecification[];
  nearbyConnectivity: {
    connections: ExtractedConnection[];
  };
};

/**
 * Matches the `source.sourceType` options already defined on the Projects
 * collection (collections/Projects.ts) — kept as the full set so this type
 * stays honest about what the schema allows, even though the current
 * pipeline only ever produces 'pasted-text' (JSON pasted from the RER
 * Claude Skill counts as pasted text, not a file upload or manual entry).
 */
export type BrochureSourceType = 'pdf' | 'pasted-text' | 'manual';

/** Bumped whenever this JSON contract changes meaningfully. Stored on the created draft for audit purposes. */
export const EXTRACTION_VERSION = '3';
