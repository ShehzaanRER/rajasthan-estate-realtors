import type { ExtractedProjectData } from './types';

/**
 * Defensive runtime validation of whatever the admin pasted. That JSON is
 * untrusted input — this never throws on a merely incomplete document
 * (nulls are expected and fine), only rebuilds the shape field-by-field so
 * nothing unexpected (wrong types, extra keys, prototype pollution
 * attempts) reaches the rest of the pipeline.
 *
 * validateExtractedProject silently coerces anything unrecognized to
 * null/omitted, by design — it must never throw just because a field is
 * missing. findSchemaWarnings is the separate, non-blocking companion that
 * reports exactly what was ignored (unknown keys, wrong types, invalid
 * enum values, an attempt to set a server-controlled field) so that
 * information reaches the admin as a review flag instead of disappearing
 * silently. Call both — validateExtractedProject for the data,
 * findSchemaWarnings for what to double-check.
 */

export class ExtractionValidationError extends Error {}

const AREA_UNITS = new Set(['sq-ft', 'sq-m']);
const PROJECT_TYPES = new Set(['residential', 'commercial', 'mixed-use']);
const PROPERTY_TYPES = new Set(['apartment', 'villa', 'office', 'shop', 'showroom', 'other']);
const POSSESSION_STATUSES = new Set(['ready-to-move', 'under-construction']);
const AVAILABILITY_VALUES = new Set(['available', 'limited', 'sold-out']);
const DISTANCE_UNITS = new Set(['km', 'm']);
const CONNECTION_CATEGORIES = new Set([
  'transport',
  'metro',
  'railway-station',
  'airport',
  'road-highway',
  'school',
  'college',
  'hospital',
  'shopping',
  'restaurant',
  'business-district',
  'park',
  'religious-place',
  'other',
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function asEnumOrNull<T extends string>(value: unknown, allowed: Set<string>): T | null {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : null;
}

export function validateExtractedProject(raw: unknown): ExtractedProjectData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ExtractionValidationError('Pasted JSON was not a JSON object.');
  }

  const r = raw as Record<string, unknown>;
  const location = asRecord(r.location);
  const legal = asRecord(r.legal);
  const projectDetails = asRecord(r.projectDetails);
  const nearbyConnectivity = asRecord(r.nearbyConnectivity);
  const configurationsRaw = Array.isArray(r.configurations) ? r.configurations : [];
  const specificationsRaw = Array.isArray(r.specifications) ? r.specifications : [];
  const connectionsRaw = Array.isArray(nearbyConnectivity.connections) ? nearbyConnectivity.connections : [];

  return {
    name: asStringOrNull(r.name),
    developer: asStringOrNull(r.developer),
    location: {
      address: asStringOrNull(location.address),
      locality: asStringOrNull(location.locality),
      area: asStringOrNull(location.area),
      city: asStringOrNull(location.city),
      state: asStringOrNull(location.state),
      pincode: asStringOrNull(location.pincode),
    },
    legal: {
      reraNumber: asStringOrNull(legal.reraNumber),
      reraInfo: asStringOrNull(legal.reraInfo),
    },
    description: asStringOrNull(r.description),
    highlights: asStringArray(r.highlights),
    configurations: configurationsRaw.map((entry) => {
      const cfg = asRecord(entry);
      return {
        name: asStringOrNull(cfg.name),
        carpetArea: asNumberOrNull(cfg.carpetArea),
        minArea: asNumberOrNull(cfg.minArea),
        maxArea: asNumberOrNull(cfg.maxArea),
        areaUnit: asEnumOrNull(cfg.areaUnit, AREA_UNITS),
        startingPrice: asNumberOrNull(cfg.startingPrice),
        maxPrice: asNumberOrNull(cfg.maxPrice),
        priceLabel: asStringOrNull(cfg.priceLabel),
        notes: asStringOrNull(cfg.notes),
        availability: asEnumOrNull(cfg.availability, AVAILABILITY_VALUES),
      };
    }),
    projectDetails: {
      projectType: asEnumOrNull(projectDetails.projectType, PROJECT_TYPES),
      propertyType: asEnumOrNull(projectDetails.propertyType, PROPERTY_TYPES),
      possessionStatus: asEnumOrNull(projectDetails.possessionStatus, POSSESSION_STATUSES),
      possessionDate: asStringOrNull(projectDetails.possessionDate),
      constructionStatus: asStringOrNull(projectDetails.constructionStatus),
      numberOfTowers: asNumberOrNull(projectDetails.numberOfTowers),
      numberOfFloors: asNumberOrNull(projectDetails.numberOfFloors),
      totalUnits: asNumberOrNull(projectDetails.totalUnits),
      parkingInfo: asStringOrNull(projectDetails.parkingInfo),
      developerDescription: asStringOrNull(projectDetails.developerDescription),
    },
    amenities: asStringArray(r.amenities),
    specifications: specificationsRaw
      .map((entry) => {
        const spec = asRecord(entry);
        return { label: asStringOrNull(spec.label), value: asStringOrNull(spec.value) };
      })
      .filter((spec): spec is { label: string; value: string } => Boolean(spec.label && spec.value)),
    nearbyConnectivity: {
      connections: connectionsRaw.map((entry) => {
        const connection = asRecord(entry);
        return {
          name: asStringOrNull(connection.name),
          category: asEnumOrNull(connection.category, CONNECTION_CATEGORIES),
          travelTimeMinutes: asNumberOrNull(connection.travelTimeMinutes),
          distance: asNumberOrNull(connection.distance),
          distanceUnit: asEnumOrNull(connection.distanceUnit, DISTANCE_UNITS),
        };
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// findSchemaWarnings — non-blocking companion to validateExtractedProject.
// Reports what got ignored instead of letting it disappear silently: unknown
// keys, wrong-typed known keys, unrecognized enum values, and any attempt to
// set a server-controlled field from the pasted JSON.
// ---------------------------------------------------------------------------

type FieldKind = 'string' | 'number' | 'array' | 'object';

const SERVER_CONTROLLED_KEYS = new Set(['projectId', 'status', 'slug']);

const TOP_LEVEL_FIELDS: Record<string, FieldKind> = {
  name: 'string',
  developer: 'string',
  location: 'object',
  legal: 'object',
  description: 'string',
  highlights: 'array',
  configurations: 'array',
  projectDetails: 'object',
  amenities: 'array',
  specifications: 'array',
  nearbyConnectivity: 'object',
};

const LOCATION_FIELDS: Record<string, FieldKind> = {
  address: 'string',
  locality: 'string',
  area: 'string',
  city: 'string',
  state: 'string',
  pincode: 'string',
};

const LEGAL_FIELDS: Record<string, FieldKind> = {
  reraNumber: 'string',
  reraInfo: 'string',
};

const PROJECT_DETAILS_FIELDS: Record<string, FieldKind> = {
  projectType: 'string',
  propertyType: 'string',
  possessionStatus: 'string',
  possessionDate: 'string',
  constructionStatus: 'string',
  numberOfTowers: 'number',
  numberOfFloors: 'number',
  totalUnits: 'number',
  parkingInfo: 'string',
  developerDescription: 'string',
};

const CONFIGURATION_FIELDS: Record<string, FieldKind> = {
  name: 'string',
  carpetArea: 'number',
  minArea: 'number',
  maxArea: 'number',
  areaUnit: 'string',
  startingPrice: 'number',
  maxPrice: 'number',
  priceLabel: 'string',
  notes: 'string',
  availability: 'string',
};

const SPECIFICATION_FIELDS: Record<string, FieldKind> = {
  label: 'string',
  value: 'string',
};

const NEARBY_CONNECTIVITY_FIELDS: Record<string, FieldKind> = {
  connections: 'array',
};

const CONNECTION_FIELDS: Record<string, FieldKind> = {
  name: 'string',
  category: 'string',
  travelTimeMinutes: 'number',
  distance: 'number',
  distanceUnit: 'string',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function kindOf(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function checkObjectShape(
  obj: Record<string, unknown>,
  path: string,
  knownFields: Record<string, FieldKind>,
  warnings: string[],
  skip?: Set<string>,
): void {
  for (const key of Object.keys(obj)) {
    if (skip?.has(key)) {
      continue;
    }

    if (!(key in knownFields)) {
      warnings.push(`Unrecognized field "${path}${key}" in the pasted JSON was ignored.`);
      continue;
    }

    const value = obj[key];
    if (value === null || value === undefined) {
      continue;
    }

    const expected = knownFields[key];
    const actual = kindOf(value);
    if (expected !== actual) {
      warnings.push(`"${path}${key}" should be a ${expected} but was a ${actual} — ignored.`);
    }
  }
}

function checkEnumValue(obj: Record<string, unknown>, path: string, key: string, allowed: Set<string>, warnings: string[]): void {
  const value = obj[key];
  if (typeof value === 'string' && value.trim() && !allowed.has(value)) {
    warnings.push(`"${path}" had an unrecognized value "${value}" — treated as not provided.`);
  }
}

/**
 * Walks the raw pasted JSON and reports anything validateExtractedProject
 * silently dropped: unrecognized fields, wrong-typed known fields,
 * unrecognized enum values, and server-controlled fields (projectId,
 * status, slug) that can never be set this way. Never throws — always
 * returns, even for a totally malformed payload (in which case
 * validateExtractedProject's own hard error already covers it).
 */
export function findSchemaWarnings(raw: unknown): string[] {
  const warnings: string[] = [];

  if (!isPlainObject(raw)) {
    return warnings;
  }

  for (const key of Object.keys(raw)) {
    if (SERVER_CONTROLLED_KEYS.has(key)) {
      warnings.push(`"${key}" is server-controlled and cannot be set from pasted JSON — it was ignored.`);
    }
  }

  checkObjectShape(raw, '', TOP_LEVEL_FIELDS, warnings, SERVER_CONTROLLED_KEYS);

  if (isPlainObject(raw.location)) {
    checkObjectShape(raw.location, 'location.', LOCATION_FIELDS, warnings);
  }

  if (isPlainObject(raw.legal)) {
    checkObjectShape(raw.legal, 'legal.', LEGAL_FIELDS, warnings);
  }

  if (isPlainObject(raw.projectDetails)) {
    checkObjectShape(raw.projectDetails, 'projectDetails.', PROJECT_DETAILS_FIELDS, warnings);
    checkEnumValue(raw.projectDetails, 'projectDetails.projectType', 'projectType', PROJECT_TYPES, warnings);
    checkEnumValue(raw.projectDetails, 'projectDetails.propertyType', 'propertyType', PROPERTY_TYPES, warnings);
    checkEnumValue(raw.projectDetails, 'projectDetails.possessionStatus', 'possessionStatus', POSSESSION_STATUSES, warnings);
  }

  if (Array.isArray(raw.configurations)) {
    raw.configurations.forEach((entry, index) => {
      if (!isPlainObject(entry)) {
        return;
      }
      const path = `configurations[${index}].`;
      checkObjectShape(entry, path, CONFIGURATION_FIELDS, warnings);
      checkEnumValue(entry, `${path}areaUnit`, 'areaUnit', AREA_UNITS, warnings);
      checkEnumValue(entry, `${path}availability`, 'availability', AVAILABILITY_VALUES, warnings);
    });
  }

  if (Array.isArray(raw.specifications)) {
    raw.specifications.forEach((entry, index) => {
      if (isPlainObject(entry)) {
        checkObjectShape(entry, `specifications[${index}].`, SPECIFICATION_FIELDS, warnings);
      }
    });
  }

  if (isPlainObject(raw.nearbyConnectivity)) {
    checkObjectShape(raw.nearbyConnectivity, 'nearbyConnectivity.', NEARBY_CONNECTIVITY_FIELDS, warnings);

    if (Array.isArray(raw.nearbyConnectivity.connections)) {
      raw.nearbyConnectivity.connections.forEach((entry, index) => {
        if (!isPlainObject(entry)) {
          return;
        }
        const path = `nearbyConnectivity.connections[${index}].`;
        checkObjectShape(entry, path, CONNECTION_FIELDS, warnings);
        checkEnumValue(entry, `${path}category`, 'category', CONNECTION_CATEGORIES, warnings);
        checkEnumValue(entry, `${path}distanceUnit`, 'distanceUnit', DISTANCE_UNITS, warnings);
      });
    }
  }

  return warnings;
}
