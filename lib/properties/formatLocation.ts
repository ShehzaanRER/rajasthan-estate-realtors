import type { Property } from '../../payload-types';
import type { PublicLocation } from './types';

function textOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function uniqueJoin(parts: Array<string | null | undefined>): string {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const part of parts) {
    const value = textOrNull(part);
    if (!value) {
      continue;
    }

    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    ordered.push(value);
  }

  return ordered.join(', ');
}

export function formatLocationDisplay(location: Property['location'] | null | undefined): string {
  if (!location) {
    return '';
  }

  return uniqueJoin([location.locality, location.area, location.city]);
}

export function formatMapsQuery(location: Property['location'] | null | undefined): string {
  const address = textOrNull(location?.address);
  if (address) {
    return address;
  }

  return formatLocationDisplay(location);
}

export function mapPublicLocation(location: Property['location'] | null | undefined): PublicLocation | null {
  if (!location) {
    return null;
  }

  const locality = textOrNull(location.locality);
  const city = textOrNull(location.city);

  if (!locality || !city) {
    return null;
  }

  const locationDisplay = formatLocationDisplay(location);

  return {
    locality,
    area: textOrNull(location.area),
    city,
    state: textOrNull(location.state),
    address: textOrNull(location.address),
    latitude: typeof location.latitude === 'number' && Number.isFinite(location.latitude) ? location.latitude : null,
    longitude:
      typeof location.longitude === 'number' && Number.isFinite(location.longitude) ? location.longitude : null,
    mapsQuery: formatMapsQuery(location) || locationDisplay,
  };
}

function formatGroupedNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
}

export function formatAreaDisplay(
  area: number | null | undefined,
  areaUnit: NonNullable<Property['details']>['areaUnit'] | null | undefined,
): string | null {
  if (area == null || !Number.isFinite(area) || area <= 0) {
    return null;
  }

  const formatted = formatGroupedNumber(area);

  if (areaUnit === 'sq-m') {
    return `${formatted} sq. m.`;
  }

  if (areaUnit === 'sq-ft') {
    return `${formatted} sq. ft.`;
  }

  return formatted;
}
