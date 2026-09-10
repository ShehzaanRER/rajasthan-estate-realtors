import type { PayloadHandler, PayloadRequest } from 'payload'
import { generateNearbySuggestions } from '../../lib/nearby-locations/generateNearbySuggestions'
import type { Property } from '../../payload-types'

const SAVE_COORDINATES_MESSAGE =
  'Please save this property and add latitude and longitude before generating nearby locations.'

const MISSING_KEY_MESSAGE =
  'Nearby location generation is not configured. Add the required Maps API key to the server environment.'

function routeParamId(req: PayloadRequest): number | string | null {
  const raw = req.routeParams?.id

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }

  if (typeof raw === 'string' && raw.trim()) {
    const asNumber = Number(raw)
    return Number.isInteger(asNumber) ? asNumber : raw
  }

  return null
}

function hasCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const status = (error as { status?: number }).status
  const name = (error as { name?: string }).name
  const message = String((error as { message?: string }).message || '')

  return status === 404 || name === 'NotFound' || /not found/i.test(message)
}

export const generateNearbyLocationsHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const id = routeParamId(req)

  if (id === null) {
    return Response.json({ message: 'A saved property is required.' }, { status: 400 })
  }

  let property: Property

  try {
    property = (await req.payload.findByID({
      collection: 'properties',
      id,
      depth: 0,
      req,
    })) as Property
  } catch (error) {
    if (isNotFoundError(error)) {
      return Response.json({ message: 'Property not found.' }, { status: 404 })
    }

    return Response.json({ message: 'Unable to load the saved property.' }, { status: 500 })
  }

  const propertyId = property.propertyId?.trim()
  const latitude = property.location?.latitude
  const longitude = property.location?.longitude

  if (!propertyId || !hasCoordinate(latitude) || !hasCoordinate(longitude)) {
    return Response.json({ message: SAVE_COORDINATES_MESSAGE }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()

  if (!apiKey) {
    return Response.json({ message: MISSING_KEY_MESSAGE }, { status: 503 })
  }

  try {
    const result = await generateNearbySuggestions({
      apiKey,
      latitude,
      longitude,
      propertyId,
      existingConnections: property.nearbyConnectivity?.connections ?? [],
    })

    return Response.json(result)
  } catch (error) {
    const warnings =
      error && typeof error === 'object' && Array.isArray((error as { warnings?: unknown }).warnings)
        ? ((error as { warnings: string[] }).warnings)
        : []
    const status =
      error && typeof error === 'object' && typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 502

    return Response.json(
      {
        message: 'Unable to generate nearby locations.',
        warnings,
      },
      { status },
    )
  }
}
