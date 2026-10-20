import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import {
  forgetPlaces,
  loadPlaceSearch,
  PLACES_ATTRIBUTION,
  PLACES_URL,
  searchPlaces,
} from './load'
import { normaliseText } from './normalise'
import { createPlaceSearch } from './search'
import type { PlaceData } from './types'

describe('normaliseText', () => {
  test.each([
    ['Whangārei', 'whangarei'],
    ['Arthur’s Pass', 'arthurs pass'],
    ["Arthur's Pass", 'arthurs pass'],
    ['Aoraki / Mount Cook', 'aoraki mount cook'],
    ['  QUEENSTOWN  ', 'queenstown'],
    ['Mt Cook', 'mount cook'],
    ['St. Arnaud', 'saint arnaud'],
    ['Lk Tekapo', 'lake tekapo'],
    ['Pt Chevalier', 'point chevalier'],
    ['Ft Worth', 'fort worth'],
  ])('%s is %s', (text, expected) => {
    expect(normaliseText(text)).toBe(expected)
  })

  test('leaves a word that merely starts like a short form alone', () => {
    expect(normaliseText('Stewart Island')).toBe('stewart island')
    expect(normaliseText('Mtwara')).toBe('mtwara')
  })

  test('says Mount and Mt, and Saint and St, the same', () => {
    expect(normaliseText('Mount Cook')).toBe(normaliseText('Mt Cook'))
    expect(normaliseText('Saint Arnaud')).toBe(normaliseText('St Arnaud'))
  })
})

// A few places, as the file stores them: [name, lat*1000, lon*1000, kind, rank, context].
const data: PlaceData = {
  version: 1,
  source: 'test',
  generated: '2026-10-20',
  kinds: [
    ['PPL', 'Town'],
    ['MT', 'Mountain'],
    ['BAY', 'Bay'],
    ['LK', 'Lake'],
    ['HUT', 'Hut'],
  ],
  contexts: [
    'Otago',
    'Canterbury',
    'Eastern Cape, South Africa',
    'Northland',
    'Tasman District',
  ],
  places: [
    ['Queenstown', -45030, 168663, 0, 152, 0],
    ['Queenstown', -31898, 26875, 0, 141, 2],
    ['Queenstown Bay', -45032, 168660, 2, 62, 0],
    ['Aoraki / Mount Cook', -43595, 170142, 1, 78, 1],
    ['Mount Cook Village', -43733, 170096, 0, 120, 1],
    ['Whangārei', -35725, 174323, 0, 150, 3],
    ['Arthur’s Pass', -42940, 171563, 0, 105, 1],
    ['St Arnaud', -41800, 172840, 0, 102, 4],
    ['Lake Wanaka', -44500, 169100, 3, 80, 0],
    ['Wanaka', -44703, 169132, 0, 153, 0],
    ['Hooker Hut', -43600, 170000, 4, 68, 1],
  ],
}
const { search } = createPlaceSearch(data)
const names = (query: string, limit?: number) =>
  search(query, limit).map((place) => place.name)

describe('searching the places', () => {
  test('finds a place by its name and says what and where it is', () => {
    expect(search('queenstown')[0]).toEqual({
      name: 'Queenstown',
      context: 'Otago',
      kind: 'Town',
      latitude: -45.03,
      longitude: 168.663,
    })
  })

  test('is not bothered by case, accents or apostrophes', () => {
    expect(names('WHANGAREI')).toEqual(['Whangārei'])
    expect(names('whangārei')).toEqual(['Whangārei'])
    expect(names('arthurs')).toEqual(['Arthur’s Pass'])
    expect(names("arthur's pass")).toEqual(['Arthur’s Pass'])
  })

  test('finds a place from the start of its name, as someone types it', () => {
    expect(names('queen')).toContain('Queenstown')
    expect(names('wan')).toEqual(
      expect.arrayContaining(['Wanaka', 'Lake Wanaka']),
    )
  })

  test('finds "mt cook" as Mount Cook, in the middle of a name too', () => {
    expect(names('mt cook')).toEqual([
      'Mount Cook Village',
      'Aoraki / Mount Cook',
    ])
    expect(names('mount cook')).toEqual([
      'Mount Cook Village',
      'Aoraki / Mount Cook',
    ])
  })

  test('finds a place by a word that is not the first, in any order', () => {
    expect(names('aoraki')).toEqual(['Aoraki / Mount Cook'])
    expect(names('cook mount')).toEqual(
      expect.arrayContaining(['Aoraki / Mount Cook']),
    )
  })

  test('reads St and Saint as the same', () => {
    expect(names('st arnaud')).toEqual(['St Arnaud'])
    expect(names('saint arnaud')).toEqual(['St Arnaud'])
  })

  test('puts the whole name first, then names that start with it, then the rest', () => {
    // "wanaka": the town (whole name) before "Lake Wanaka" (a word in the middle).
    expect(names('wanaka')).toEqual(['Wanaka', 'Lake Wanaka'])
    // "queenstown": both towns of that name, then the bay that merely starts with it.
    expect(names('queenstown')).toEqual([
      'Queenstown',
      'Queenstown',
      'Queenstown Bay',
    ])
  })

  test('puts the more important of two places of one name first, and tells them apart', () => {
    const [first, second] = search('queenstown')

    expect(first.context).toBe('Otago')
    expect(second.context).toBe('Eastern Cape, South Africa')
  })

  test('gives only as many as asked for', () => {
    expect(search('queenstown', 2)).toHaveLength(2)
    expect(search('queenstown', 0)).toEqual([])
  })

  test('gives eight by default', () => {
    const many: PlaceData = {
      ...data,
      places: Array.from({ length: 20 }, (_, i) => [
        `Place ${i}`,
        0,
        0,
        0,
        i,
        0,
      ]),
    }

    expect(createPlaceSearch(many).search('place')).toHaveLength(8)
  })

  test.each([[''], ['a'], ['  '], ['!!']])(
    'gives nothing for "%s": too little to go on',
    (query) => {
      expect(search(query)).toEqual([])
    },
  )

  test('gives nothing for a name that is nowhere', () => {
    expect(search('xyzzy')).toEqual([])
  })

  test('needs every word to match: "queenstown cook" is neither', () => {
    expect(search('queenstown cook')).toEqual([])
  })

  test('does not match in the middle of a word', () => {
    expect(names('stown')).toEqual([])
  })
})

describe('loading the places', () => {
  const file = JSON.stringify(data)
  const respond = (body: string, status = 200) =>
    vi.fn(async () => new Response(body, { status }))

  beforeEach(() => forgetPlaces())

  test('asks for the places file, and searches it', async () => {
    const fetcher = respond(file)

    const places = await loadPlaceSearch(fetcher as unknown as typeof fetch)

    expect(fetcher).toHaveBeenCalledWith(PLACES_URL)
    expect(places.search('wanaka')[0].name).toBe('Wanaka')
  })

  test('loads the file once however many searches there are', async () => {
    const fetcher = respond(file)

    await loadPlaceSearch(fetcher as unknown as typeof fetch)
    await loadPlaceSearch(fetcher as unknown as typeof fetch)

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('shares one load between searches that start together', async () => {
    const fetcher = respond(file)

    await Promise.all([
      loadPlaceSearch(fetcher as unknown as typeof fetch),
      loadPlaceSearch(fetcher as unknown as typeof fetch),
    ])

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  test('does not load anything until it is asked to', () => {
    const fetcher = respond(file)

    expect(fetcher).not.toHaveBeenCalled()
  })

  test.each([
    ['the file is missing', respond('nope', 404)],
    ['the file is not the places', respond(JSON.stringify({ hello: 'world' }))],
    ['the file is not JSON', respond('<html>')],
    [
      'the connection fails',
      vi.fn(async () => Promise.reject(new TypeError('offline'))),
    ],
  ])('says so when %s', async (_why, fetcher) => {
    await expect(
      loadPlaceSearch(fetcher as unknown as typeof fetch),
    ).rejects.toThrow()
  })

  test('tries again after a failure, since it is not remembered', async () => {
    const failing = respond('nope', 500)
    await expect(
      loadPlaceSearch(failing as unknown as typeof fetch),
    ).rejects.toThrow()

    const working = respond(file)
    const places = await loadPlaceSearch(working as unknown as typeof fetch)

    expect(working).toHaveBeenCalledTimes(1)
    expect(places.search('wanaka')).toHaveLength(2)
  })

  test('searchPlaces loads, then searches', async () => {
    vi.stubGlobal('fetch', respond(file))

    const found = await searchPlaces('queenstown', 1)

    expect(found[0].name).toBe('Queenstown')
    vi.unstubAllGlobals()
  })
})

// The real file, as committed (made by `npm run places:build`).
describe('the committed places file', () => {
  // Tests run from the repository root.
  const path = join(process.cwd(), 'public/places/places.v1.json')
  const real = JSON.parse(readFileSync(path, 'utf8')) as PlaceData
  const { search: searchReal } = createPlaceSearch(real)
  const first = (query: string) => searchReal(query)[0]

  test('credits GeoNames, as its licence asks', () => {
    expect(real.source).toBe(PLACES_ATTRIBUTION)
    expect(PLACES_ATTRIBUTION).toMatch(/GeoNames/)
    expect(PLACES_ATTRIBUTION).toMatch(/CC BY 4\.0/)
  })

  test('stays small enough to download on first search: under 3MB, as stored', () => {
    expect(statSync(path).size).toBeLessThan(3 * 1024 * 1024)
  })

  test.each([
    ['queenstown', 'Queenstown', 'Otago', 'Town'],
    ['wanaka', 'Wanaka', 'Otago', 'Town'],
    ['wellington', 'Wellington', 'Wellington Region', 'Capital'],
    ['auckland', 'Auckland', 'Auckland', 'Town'],
    ['london', 'London', 'England, United Kingdom', 'Capital'],
    ['sydney', 'Sydney', 'New South Wales, Australia', 'Town'],
  ])('puts the right "%s" first', (query, name, context, kind) => {
    expect(first(query)).toMatchObject({ name, context, kind })
  })

  test('finds Aoraki / Mount Cook from "mt cook" and from "aoraki"', () => {
    expect(searchReal('mt cook').map((p) => p.name)).toContain(
      'Aoraki / Mount Cook',
    )
    expect(first('aoraki')?.name).toMatch(/Aoraki/)
  })

  test('finds a hut, a lake and a pass in NZ, and one name near one place is one result', () => {
    // The township comes first and the lake itself second: a town outranks a lake.
    expect(searchReal('lake tekapo').map((p) => p.kind)).toEqual([
      'Town',
      'Lake',
    ])
    expect(first('haast pass')).toMatchObject({
      kind: 'Pass',
      context: 'West Coast',
    })
    expect(first('mueller hut')).toMatchObject({
      kind: 'Hut',
      context: 'Canterbury',
    })
  })

  test('puts places in the right part of the world', () => {
    const wellington = first('wellington')
    expect(wellington.latitude).toBeCloseTo(-41.29, 1)
    expect(wellington.longitude).toBeCloseTo(174.78, 1)
    const london = first('london')
    expect(london.latitude).toBeCloseTo(51.51, 1)
    expect(london.longitude).toBeCloseTo(-0.13, 1)
  })

  test('has no place without a name, a position or a context', () => {
    for (const [name, lat, lon, kind, , context] of real.places) {
      expect(name).toBeTruthy()
      expect(Math.abs(lat)).toBeLessThanOrEqual(90000)
      expect(Math.abs(lon)).toBeLessThanOrEqual(180000)
      expect(real.kinds[kind]).toBeDefined()
      expect(real.contexts[context]).toBeTruthy()
    }
  })

  test('answers fast enough to search on every keystroke', () => {
    const started = performance.now()
    for (const query of ['qu', 'mt', 'lake', 'mount cook', 'wel'])
      searchReal(query)

    expect(performance.now() - started).toBeLessThan(500)
  })
})
