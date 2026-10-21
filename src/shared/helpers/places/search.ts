import { normaliseText } from './normalise'
import type { Place, PlaceData } from './types'

/** Fewer characters than this is too little to search for. */
const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 8

export interface PlaceSearch {
  search(query: string, limit?: number): Place[]
  /** The place in the list nearest a point, and how far it is in km. */
  nearest(
    latitude: number,
    longitude: number,
  ): { place: Place; distanceKm: number } | undefined
}

const EARTH_RADIUS_KM = 6371
const radians = (degrees: number) => (degrees * Math.PI) / 180

/** The distance between two points on the earth, in km (the haversine formula). */
export function distanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const dLatitude = radians(toLatitude - fromLatitude)
  const dLongitude = radians(toLongitude - fromLongitude)
  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(radians(fromLatitude)) *
      Math.cos(radians(toLatitude)) *
      Math.sin(dLongitude / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * Searching a place list. Every word typed must start a word of the name, so
 * "mt cook" finds "Aoraki / Mount Cook" and "wanaka" finds "Lake Wanaka". Results
 * come in order of how well the name matches (the whole name, then its start, then
 * any words), then by how important the place is, then shorter names first.
 *
 * Built once from the list (the names are tidied up front) and then searched with
 * every keystroke; a scan of the whole list is fast enough not to need more.
 */
export function createPlaceSearch(data: PlaceData): PlaceSearch {
  const keys = data.places.map(([name]) => normaliseText(name))
  const words = keys.map((key) => key.split(' '))

  const placeAt = (index: number): Place => {
    const [name, latitude, longitude, kind, , context] = data.places[index]
    return {
      name,
      context: data.contexts[context],
      kind: data.kinds[kind][1],
      latitude: latitude / 1000,
      longitude: longitude / 1000,
    }
  }

  return {
    nearest(latitude, longitude) {
      let best = -1
      let bestKm = Infinity
      for (let index = 0; index < data.places.length; index++) {
        const [, placeLatitude, placeLongitude] = data.places[index]
        const km = distanceKm(
          latitude,
          longitude,
          placeLatitude / 1000,
          placeLongitude / 1000,
        )
        if (km < bestKm) {
          best = index
          bestKm = km
        }
      }
      return best < 0 ? undefined : { place: placeAt(best), distanceKm: bestKm }
    },

    search(query, limit = DEFAULT_LIMIT) {
      const wanted = normaliseText(query)
      if (wanted.length < MIN_QUERY_LENGTH) return []
      const queryWords = wanted.split(' ')

      const found: { index: number; tier: number }[] = []
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (!key.includes(queryWords[0])) continue
        if (
          !queryWords.every((q) => words[index].some((w) => w.startsWith(q)))
        ) {
          continue
        }
        found.push({
          index,
          tier: key === wanted ? 3 : key.startsWith(wanted) ? 2 : 1,
        })
      }

      found.sort(
        (a, b) =>
          b.tier - a.tier ||
          data.places[b.index][4] - data.places[a.index][4] ||
          keys[a.index].length - keys[b.index].length ||
          data.places[a.index][0].localeCompare(data.places[b.index][0]),
      )

      return found
        .slice(0, Math.max(0, limit))
        .map(({ index }) => placeAt(index))
    },
  }
}
