// Turns the GeoNames downloads into the compact place list the app searches.
// Pure functions, so they can be tested on a few rows; `build.mjs` does the file work.
//
// GeoNames rows are tab-separated: 0 id, 1 name, 2 ascii name, 3 alternate names,
// 4 latitude, 5 longitude, 6 feature class, 7 feature code, 8 country, 9 other
// countries, 10 first-level division (region), ... 14 population.

export const SOURCE =
  'Place names from GeoNames (https://www.geonames.org), licensed CC BY 4.0'

/** Towns abroad smaller than this are left out: 15,000 people. */
export const MIN_WORLD_POPULATION = 15000

/**
 * The kinds of place kept: feature code, what to call it, and how important it is
 * (higher comes first in search). NZ has 67,000 features, but 21,000 are streams
 * and 9,600 are farms; these are the ones someone might pin a place for.
 */
export const KINDS = {
  // GeoNames gives a capital and the seats of districts their own codes, and the
  // biggest NZ cities (Wellington, Auckland, Christchurch...) have them.
  PPLC: ['Capital', 110],
  PPLA: ['Town', 100],
  PPLA2: ['Town', 100],
  PPLA3: ['Town', 100],
  PPLA4: ['Town', 100],
  PPL: ['Town', 100],
  PPLX: ['Suburb', 60],
  PPLL: ['Locality', 40],
  PPLH: ['Locality', 40],
  LCTY: ['Locality', 40],
  PRK: ['Park', 65],
  LK: ['Lake', 60],
  MT: ['Mountain', 58],
  PK: ['Peak', 56],
  VLC: ['Volcano', 55],
  ISL: ['Island', 55],
  PASS: ['Pass', 52],
  GLCR: ['Glacier', 52],
  PKS: ['Peaks', 50],
  MTS: ['Range', 50],
  LKS: ['Lakes', 50],
  HUT: ['Hut', 48],
  ISLS: ['Islands', 45],
  BAY: ['Bay', 42],
  HBR: ['Harbour', 42],
  HUTS: ['Huts', 40],
  PEN: ['Peninsula', 38],
  CAPE: ['Cape', 36],
  FLLS: ['Falls', 36],
  BCH: ['Beach', 34],
  RDGE: ['Ridge', 34],
  GRGE: ['Gorge', 34],
  STRT: ['Strait', 34],
  VAL: ['Valley', 32],
  SPNG: ['Spring', 30],
  CRTR: ['Crater', 30],
  PLN: ['Plain', 30],
  CLF: ['Cliff', 30],
  COVE: ['Cove', 28],
  PT: ['Point', 26],
}

/** Places in New Zealand rank above the same kind of place elsewhere. */
const NEW_ZEALAND_BONUS = 20
/** Within about this many degrees (15km), a place with the same name is the same place. */
const SAME_PLACE_DEGREES = 0.15

/** Lower case, no accents, no punctuation: the same word however it was written. */
export function normaliseName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’‘ʻ`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** The columns used, from GeoNames text. Rows without a usable position are dropped. */
export function parseRows(text) {
  const rows = []
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const f = line.split('\t')
    const latitude = Number(f[4])
    const longitude = Number(f[5])
    // Number('') is 0, which would put a place with no position at 0, 0.
    const positioned = f[4] !== '' && f[5] !== ''
    if (
      !f[1] ||
      !positioned ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    )
      continue
    rows.push({
      name: f[1],
      latitude,
      longitude,
      code: f[7],
      country: f[8],
      region: f[10],
      population: Number(f[14]) || 0,
    })
  }
  return rows
}

/** How important a place is: its kind, a bonus for NZ, and a little for the number of people. */
export function rankOf({ code, country, population }) {
  const [, weight] = KINDS[code]
  return (
    weight +
    (country === 'NZ' ? NEW_ZEALAND_BONUS : 0) +
    Math.round(Math.log10(population + 1) * 8)
  )
}

/** GeoNames' region names, keyed like "NZ.E8", and country names keyed by code. */
export function parseNames(adminText, countryText) {
  const regions = new Map()
  for (const line of adminText.split('\n')) {
    const f = line.split('\t')
    if (f[0] && f[1]) regions.set(f[0], f[1])
  }
  const countries = new Map()
  for (const line of countryText.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const f = line.split('\t')
    if (f[0] && f[4]) countries.set(f[0], f[4])
  }
  return { regions, countries }
}

/** What tells two places of one name apart: the region in NZ, "region, country" abroad. */
export function contextOf(row, { regions, countries }) {
  const region = regions.get(`${row.country}.${row.region}`)
  const country = countries.get(row.country) ?? row.country
  if (row.country === 'NZ') return region ?? 'New Zealand'
  return region ? `${region}, ${country}` : country
}

/**
 * One entry per place: of the places with the same name within 15km of each other,
 * the most important is kept ("Lake Wanaka" is listed three times; "Aoraki/Mount
 * Cook" as both a mountain and a locality). Places of one name further apart stay.
 */
export function withoutDuplicates(places) {
  const byName = new Map()
  for (const place of [...places].sort((a, b) => b.rank - a.rank)) {
    const key = normaliseName(place.name)
    const kept = byName.get(key) ?? []
    const same = kept.some(
      (other) =>
        Math.abs(other.latitude - place.latitude) < SAME_PLACE_DEGREES &&
        Math.abs(other.longitude - place.longitude) < SAME_PLACE_DEGREES,
    )
    if (!same) {
      kept.push(place)
      byName.set(key, kept)
    }
  }
  return [...byName.values()].flat()
}

/** The place list, in the compact form the app loads. `generated` is the date, as text. */
export function buildPlaceData({
  nzText,
  worldText,
  adminText,
  countryText,
  generated,
}) {
  const names = parseNames(adminText, countryText)
  const wanted = (row) => row.code in KINDS
  const rows = [
    ...parseRows(nzText).filter((row) => row.country === 'NZ' && wanted(row)),
    // Towns abroad are all "a town" (or a capital), whatever GeoNames' finer code.
    ...parseRows(worldText)
      .filter(
        (row) => row.country !== 'NZ' && row.population >= MIN_WORLD_POPULATION,
      )
      .map((row) => ({ ...row, code: row.code === 'PPLC' ? 'PPLC' : 'PPL' })),
  ]
  const places = withoutDuplicates(
    rows.map((row) => ({
      ...row,
      rank: rankOf(row),
      context: contextOf(row, names),
    })),
  ).sort((a, b) => b.rank - a.rank || a.name.localeCompare(b.name))

  const kindCodes = [...new Set(places.map((p) => p.code))].sort()
  const contexts = [...new Set(places.map((p) => p.context))].sort()
  return {
    version: 1,
    source: SOURCE,
    generated,
    kinds: kindCodes.map((code) => [code, KINDS[code][0]]),
    contexts,
    // [name, latitude and longitude in thousandths of a degree (about 100m), kind, rank, context]
    places: places.map((p) => [
      p.name,
      Math.round(p.latitude * 1000),
      Math.round(p.longitude * 1000),
      kindCodes.indexOf(p.code),
      p.rank,
      contexts.indexOf(p.context),
    ]),
  }
}

/** JSON with one place to a line, so a refresh shows in a diff as places, not one huge line. */
export function serialise(data) {
  const { places, ...rest } = data
  const head = JSON.stringify(rest).slice(0, -1)
  const lines = places.map((place) => JSON.stringify(place))
  return `${head},"places":[\n${lines.join(',\n')}\n]}\n`
}
