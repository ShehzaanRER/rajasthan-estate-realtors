export const CONNECTION_CATEGORIES = [
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
] as const

export type ConnectionCategory = (typeof CONNECTION_CATEGORIES)[number]

export type DistanceUnit = 'km' | 'm'

export type NearbySuggestion = {
  name: string
  category: ConnectionCategory
  distance: number
  distanceUnit: DistanceUnit
  alreadyExists?: boolean
}

export type NearbyGenerationResult = {
  propertyId: string
  suggestions: NearbySuggestion[]
  warnings: string[]
}

export type NearbyPlaceLocation = {
  latitude: number
  longitude: number
}

export type NearbyPlace = {
  displayName?: { text?: string | null } | null
  location?: NearbyPlaceLocation | null
  primaryType?: string | null
  types?: string[] | null
}
