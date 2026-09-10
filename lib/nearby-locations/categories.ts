import type { ConnectionCategory } from './types'

const GOOGLE_TYPE_TO_CATEGORY: Record<string, ConnectionCategory> = {
  subway_station: 'metro',
  light_rail_station: 'metro',
  train_station: 'railway-station',
  airport: 'airport',
  international_airport: 'airport',
  hospital: 'hospital',
  general_hospital: 'hospital',
  school: 'school',
  primary_school: 'school',
  secondary_school: 'school',
  university: 'college',
  shopping_mall: 'shopping',
  department_store: 'shopping',
  corporate_office: 'business-district',
  business_center: 'business-district',
  park: 'park',
  city_park: 'park',
  national_park: 'park',
  hindu_temple: 'religious-place',
  mosque: 'religious-place',
  church: 'religious-place',
  synagogue: 'religious-place',
  buddhist_temple: 'religious-place',
  transit_station: 'transport',
  bus_station: 'transport',
  restaurant: 'restaurant',
}

const CATEGORY_PRIORITY: ConnectionCategory[] = [
  'metro',
  'railway-station',
  'airport',
  'hospital',
  'school',
  'college',
  'shopping',
  'business-district',
  'park',
  'religious-place',
  'transport',
  'restaurant',
  'other',
]

export const CATEGORY_LABELS: Record<ConnectionCategory, string> = {
  transport: 'Transport',
  metro: 'Metro',
  'railway-station': 'Railway Station',
  airport: 'Airport',
  'road-highway': 'Road / Highway',
  school: 'School',
  college: 'College',
  hospital: 'Hospital',
  shopping: 'Shopping',
  restaurant: 'Restaurant',
  'business-district': 'Business District',
  park: 'Park',
  'religious-place': 'Religious Place',
  other: 'Other',
}

function mappedCategory(googleType: string | null | undefined): ConnectionCategory | null {
  if (!googleType) {
    return null
  }

  return GOOGLE_TYPE_TO_CATEGORY[googleType] ?? null
}

export function mapGoogleTypesToCategory(
  primaryType: string | null | undefined,
  types: string[] | null | undefined,
): ConnectionCategory {
  const candidates: ConnectionCategory[] = []
  const fromPrimary = mappedCategory(primaryType)

  if (fromPrimary) {
    candidates.push(fromPrimary)
  }

  for (const type of types ?? []) {
    const mapped = mappedCategory(type)
    if (mapped) {
      candidates.push(mapped)
    }
  }

  for (const category of CATEGORY_PRIORITY) {
    if (candidates.includes(category)) {
      return category
    }
  }

  return 'other'
}

export function isGenericUnnamedPlace(name: string, category: ConnectionCategory): boolean {
  if (!name.trim()) {
    return true
  }

  return category === 'other' && /^(point of interest|establishment|premise)$/i.test(name.trim())
}
