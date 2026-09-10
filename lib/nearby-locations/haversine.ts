import type { DistanceUnit } from './types'

const EARTH_RADIUS_M = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function haversineMetres(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const dLat = toRadians(toLat - fromLat)
  const dLng = toRadians(toLng - fromLng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function normalizeDistance(metres: number): { distance: number; distanceUnit: DistanceUnit } {
  if (!Number.isFinite(metres) || metres < 0) {
    return { distance: 0, distanceUnit: 'm' }
  }

  if (metres < 1000) {
    return { distance: Math.round(metres), distanceUnit: 'm' }
  }

  return {
    distance: Math.round(metres / 100) / 10,
    distanceUnit: 'km',
  }
}
