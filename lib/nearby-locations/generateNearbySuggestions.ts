import { AIRPORT_NEARBY_TYPES, CORE_NEARBY_TYPES } from './allowlist'
import { isGenericUnnamedPlace, mapGoogleTypesToCategory } from './categories'
import { connectionKey } from './duplicates'
import { searchNearbyPlaces } from './googlePlaces'
import { haversineMetres, normalizeDistance } from './haversine'
import type { NearbyGenerationResult, NearbyPlace, NearbySuggestion } from './types'

const MAX_SUGGESTIONS = 25

type ExistingConnection = {
  name?: string | null
  category?: string | null
}

function placeName(place: NearbyPlace): string {
  return place.displayName?.text?.trim() || ''
}

function toSuggestion(
  place: NearbyPlace,
  originLat: number,
  originLng: number,
): NearbySuggestion | null {
  const name = placeName(place)
  const latitude = place.location?.latitude
  const longitude = place.location?.longitude

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const category = mapGoogleTypesToCategory(place.primaryType, place.types)

  if (isGenericUnnamedPlace(name, category)) {
    return null
  }

  const metres = haversineMetres(originLat, originLng, latitude, longitude)
  const { distance, distanceUnit } = normalizeDistance(metres)

  return {
    name,
    category,
    distance,
    distanceUnit,
  }
}

function mergeSuggestions(
  groups: NearbySuggestion[][],
  existing: ExistingConnection[],
): NearbySuggestion[] {
  const existingKeys = new Set(
    existing
      .filter((row) => row.name && row.category)
      .map((row) => connectionKey(row.name as string, row.category as string)),
  )
  const seen = new Set<string>()
  const merged: NearbySuggestion[] = []

  for (const group of groups) {
    for (const suggestion of group) {
      const key = connectionKey(suggestion.name, suggestion.category)

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      merged.push({
        ...suggestion,
        alreadyExists: existingKeys.has(key),
      })

      if (merged.length >= MAX_SUGGESTIONS) {
        return merged
      }
    }
  }

  return merged
}

export async function generateNearbySuggestions(args: {
  apiKey: string
  latitude: number
  longitude: number
  propertyId: string
  existingConnections: ExistingConnection[]
}): Promise<NearbyGenerationResult> {
  const { apiKey, latitude, longitude, propertyId, existingConnections } = args

  const [coreOutcome, airportOutcome] = await Promise.allSettled([
    searchNearbyPlaces({
      apiKey,
      latitude,
      longitude,
      radiusMetres: 5000,
      maxResultCount: 20,
      includedTypes: CORE_NEARBY_TYPES,
    }),
    searchNearbyPlaces({
      apiKey,
      latitude,
      longitude,
      radiusMetres: 20000,
      maxResultCount: 5,
      includedTypes: AIRPORT_NEARBY_TYPES,
    }),
  ])

  const warnings: string[] = []
  const corePlaces: NearbyPlace[] = []
  const airportPlaces: NearbyPlace[] = []
  let coreFailed = false
  let airportFailed = false

  if (coreOutcome.status === 'fulfilled' && coreOutcome.value.ok) {
    corePlaces.push(...coreOutcome.value.places)
  } else {
    coreFailed = true
    const coreResult = coreOutcome.status === 'fulfilled' ? coreOutcome.value : null
    const message =
      coreResult && 'message' in coreResult
        ? coreResult.message
        : 'Core nearby search failed unexpectedly.'
    warnings.push(`Core connectivity search was unavailable. ${message}`.trim())
  }

  if (airportOutcome.status === 'fulfilled' && airportOutcome.value.ok) {
    airportPlaces.push(...airportOutcome.value.places)
  } else {
    airportFailed = true
    const airportResult = airportOutcome.status === 'fulfilled' ? airportOutcome.value : null
    const message =
      airportResult && 'message' in airportResult
        ? airportResult.message
        : 'Airport nearby search failed unexpectedly.'
    warnings.push(`Airport search was unavailable. ${message}`.trim())
  }

  if (coreFailed && airportFailed) {
    throw Object.assign(new Error('Unable to generate nearby locations.'), {
      status: 502,
      warnings,
    })
  }

  const coreSuggestions = corePlaces
    .map((place) => toSuggestion(place, latitude, longitude))
    .filter((row): row is NearbySuggestion => row !== null)

  const airportSuggestions = airportPlaces
    .map((place) => toSuggestion(place, latitude, longitude))
    .filter((row): row is NearbySuggestion => row !== null)

  return {
    propertyId,
    warnings,
    suggestions: mergeSuggestions([coreSuggestions, airportSuggestions], existingConnections),
  }
}
