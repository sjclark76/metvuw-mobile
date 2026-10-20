import { createPlaceSearch, type PlaceSearch } from './search'
import type { Place, PlaceData } from './types'

export const PLACES_URL = '/places/places.v1.json'

/** The credit GeoNames' licence (CC BY 4.0) asks to be shown wherever the names are used. */
export const PLACES_ATTRIBUTION =
  'Place names from GeoNames (https://www.geonames.org), licensed CC BY 4.0'

function isPlaceData(value: unknown): value is PlaceData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Record<string, unknown>
  return (
    data.version === 1 &&
    Array.isArray(data.kinds) &&
    Array.isArray(data.contexts) &&
    Array.isArray(data.places)
  )
}

let loading: Promise<PlaceSearch> | undefined

/**
 * The searcher, loading the place list the first time it is asked for and never
 * before: the list is about 800KB, and most visits never search. A failure is not
 * remembered, so asking again tries again. (The service worker keeps the file, so
 * once it has loaded, searching works with no connection.)
 */
export function loadPlaceSearch(
  fetcher: typeof fetch = (...args) => fetch(...args),
): Promise<PlaceSearch> {
  loading ??= fetcher(PLACES_URL)
    .then((response) => {
      if (!response.ok)
        throw new Error(`could not load places: ${response.status}`)
      return response.json() as Promise<unknown>
    })
    .then((data) => {
      if (!isPlaceData(data)) throw new Error('unusable places file')
      return createPlaceSearch(data)
    })
    .catch((error: unknown) => {
      loading = undefined
      throw error
    })
  return loading
}

/** Searches the place list, loading it first if need be. */
export async function searchPlaces(
  query: string,
  limit?: number,
): Promise<Place[]> {
  return (await loadPlaceSearch()).search(query, limit)
}

/** For tests: forget a loaded list. */
export function forgetPlaces(): void {
  loading = undefined
}
