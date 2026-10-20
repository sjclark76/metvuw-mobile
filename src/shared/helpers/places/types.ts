/**
 * The place list as it is stored (`public/places/places.v1.json`, made by
 * `scripts/places/build.mjs`): compact, with the kinds and contexts of the places
 * listed once and each place pointing at them.
 */
export interface PlaceData {
  version: 1
  /** Where the names come from, as a credit line (CC BY 4.0 requires one). */
  source: string
  generated: string
  /** [feature code, what to call it]. */
  kinds: [string, string][]
  /** The region (in NZ) or "region, country" that tells two places of a name apart. */
  contexts: string[]
  /** [name, latitude and longitude in thousandths of a degree, kind, rank, context] */
  places: [string, number, number, number, number, number][]
}

/** A place found by a search. */
export interface Place {
  name: string
  /** The region or country, to tell two places of one name apart. */
  context: string
  /** What sort of place: "Town", "Hut", "Mountain"... */
  kind: string
  latitude: number
  longitude: number
}
