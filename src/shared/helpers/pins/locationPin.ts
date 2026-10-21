import type { Place } from '@/shared/helpers/places'

/** Closer than this, a spot is called by the place's own name. */
export const AT_PLACE_KM = 1
/** Further than this from every place, a spot is called by its coordinates. */
export const NEAR_PLACE_KM = 20

export const LOCATION_KIND = 'Your location'

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** Which way the second point is from the first, as one of eight compass points. */
export function compassDirection(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): string {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const φ1 = radians(fromLatitude)
  const φ2 = radians(toLatitude)
  const Δλ = radians(toLongitude - fromLongitude)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return COMPASS[Math.round(bearing / 45) % 8]
}

/** A point as people write it: "44.61°S 169.27°E". */
export function formatCoordinates(latitude: number, longitude: number): string {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(2)}°${value < 0 ? negative : positive}`
  return `${part(latitude, 'N', 'S')} ${part(longitude, 'E', 'W')}`
}

/**
 * The place to pin for where someone is standing: named after the nearest place
 * in the list ("Near Lake Hawea · 3 km NE", or just its name when it is under a
 * kilometre away), or by its coordinates when nothing in the list is near, or the
 * list could not be had.
 */
export function placeForLocation(
  latitude: number,
  longitude: number,
  nearest?: { place: Place; distanceKm: number },
): Place {
  const base = { kind: LOCATION_KIND, latitude, longitude }
  if (!nearest || nearest.distanceKm > NEAR_PLACE_KM) {
    return {
      ...base,
      name: formatCoordinates(latitude, longitude),
      context: nearest?.place.context ?? '',
    }
  }
  const { place, distanceKm } = nearest
  if (distanceKm < AT_PLACE_KM) {
    return { ...base, name: place.name, context: place.context }
  }
  const direction = compassDirection(
    place.latitude,
    place.longitude,
    latitude,
    longitude,
  )
  return {
    ...base,
    name: `Near ${place.name} · ${Math.round(distanceKm)} km ${direction}`,
    context: place.context,
  }
}
