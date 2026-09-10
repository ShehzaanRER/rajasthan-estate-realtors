import { includedTypesForRequest, type NearbySearchIncludedType } from './allowlist'
import type { NearbyPlace } from './types'

const SEARCH_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'
const FIELD_MASK = 'places.displayName,places.location,places.primaryType,places.types'

export type SearchNearbyParams = {
  latitude: number
  longitude: number
  radiusMetres: number
  maxResultCount: number
  includedTypes: readonly string[]
  apiKey: string
}

export type SearchNearbySuccess = {
  ok: true
  places: NearbyPlace[]
}

export type SearchNearbyFailure = {
  ok: false
  message: string
}

export type SearchNearbyOutcome = SearchNearbyFailure | SearchNearbySuccess

function clampRadius(radiusMetres: number): number {
  if (!Number.isFinite(radiusMetres) || radiusMetres <= 0) {
    return 1
  }

  return Math.min(radiusMetres, 50_000)
}

function clampMaxResults(maxResultCount: number): number {
  if (!Number.isFinite(maxResultCount) || maxResultCount < 1) {
    return 1
  }

  return Math.min(Math.trunc(maxResultCount), 20)
}

export async function searchNearbyPlaces(params: SearchNearbyParams): Promise<SearchNearbyOutcome> {
  const includedTypes = includedTypesForRequest(params.includedTypes)

  if (includedTypes.length === 0) {
    return { ok: false, message: 'No supported Nearby Search types were available for this request.' }
  }

  const body = {
    languageCode: 'en',
    regionCode: 'IN',
    includedTypes: includedTypes as NearbySearchIncludedType[],
    maxResultCount: clampMaxResults(params.maxResultCount),
    rankPreference: 'DISTANCE',
    locationRestriction: {
      circle: {
        center: {
          latitude: params.latitude,
          longitude: params.longitude,
        },
        radius: clampRadius(params.radiusMetres),
      },
    },
  }

  let response: Response

  try {
    response = await fetch(SEARCH_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': params.apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, message: 'Unable to reach the location provider.' }
  }

  let payload: { error?: { message?: string }; places?: NearbyPlace[] } = {}

  try {
    payload = (await response.json()) as { error?: { message?: string }; places?: NearbyPlace[] }
  } catch {
    payload = {}
  }

  if (!response.ok) {
    return {
      ok: false,
      message: payload.error?.message || `Location provider returned status ${response.status}.`,
    }
  }

  return {
    ok: true,
    places: Array.isArray(payload.places) ? payload.places : [],
  }
}
