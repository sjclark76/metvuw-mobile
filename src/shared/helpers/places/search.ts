import { normaliseText } from './normalise'
import type { Place, PlaceData } from './types'

/** Fewer characters than this is too little to search for. */
const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 8

export interface PlaceSearch {
  search(query: string, limit?: number): Place[]
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

  return {
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

      return found.slice(0, Math.max(0, limit)).map(({ index }) => {
        const [name, latitude, longitude, kind, , context] = data.places[index]
        return {
          name,
          context: data.contexts[context],
          kind: data.kinds[kind][1],
          latitude: latitude / 1000,
          longitude: longitude / 1000,
        }
      })
    },
  }
}
