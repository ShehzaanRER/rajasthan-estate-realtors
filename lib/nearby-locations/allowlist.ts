/**
 * Table A types allowed in Nearby Search (New) `includedTypes`.
 * Source: https://developers.google.com/maps/documentation/places/web-service/place-types
 * Starred/new Table A types and Table B types are omitted from request filters.
 */
export const NEARBY_SEARCH_INCLUDED_TYPES = [
  'subway_station',
  'light_rail_station',
  'train_station',
  'transit_station',
  'hospital',
  'school',
  'university',
  'shopping_mall',
  'park',
  'corporate_office',
  'hindu_temple',
  'mosque',
  'church',
  'synagogue',
  'airport',
  'international_airport',
] as const

export type NearbySearchIncludedType = (typeof NEARBY_SEARCH_INCLUDED_TYPES)[number]

const ALLOWED = new Set<string>(NEARBY_SEARCH_INCLUDED_TYPES)

export const CORE_NEARBY_TYPES = [
  'subway_station',
  'light_rail_station',
  'train_station',
  'transit_station',
  'hospital',
  'school',
  'university',
  'shopping_mall',
  'park',
  'corporate_office',
  'hindu_temple',
  'mosque',
  'church',
  'synagogue',
] as const satisfies readonly NearbySearchIncludedType[]

export const AIRPORT_NEARBY_TYPES = [
  'airport',
  'international_airport',
] as const satisfies readonly NearbySearchIncludedType[]

export function includedTypesForRequest(intended: readonly string[]): NearbySearchIncludedType[] {
  const unique: NearbySearchIncludedType[] = []

  for (const type of intended) {
    if (!ALLOWED.has(type)) {
      continue
    }

    const allowed = type as NearbySearchIncludedType
    if (!unique.includes(allowed)) {
      unique.push(allowed)
    }
  }

  return unique
}
