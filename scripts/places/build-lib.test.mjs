import {
  buildPlaceData,
  contextOf,
  KINDS,
  MIN_WORLD_POPULATION,
  normaliseName,
  parseNames,
  parseRows,
  rankOf,
  serialise,
  SOURCE,
  withoutDuplicates,
} from './build-lib.mjs'

// A row in GeoNames' own format: id, name, ascii name, alternates, latitude,
// longitude, class, code, country, other countries, region, three more, population.
const row = ({
  name,
  latitude,
  longitude,
  code,
  country,
  region = '',
  population = 0,
}) =>
  [
    1,
    name,
    name,
    '',
    latitude,
    longitude,
    'X',
    code,
    country,
    '',
    region,
    '',
    '',
    '',
    population,
  ].join('\t')

const admin = [
  'NZ.E9\tCanterbury\tCanterbury\t1',
  'NZ.G2\tWellington Region\tWellington Region\t9',
  'US.TX\tTexas\tTexas\t2',
  'GB.ENG\tEngland\tEngland\t3',
].join('\n')
const countries = [
  '#ISO\tISO3\tnumeric\tfips\tCountry',
  'NZ\tNZL\t554\tNZ\tNew Zealand',
  'US\tUSA\t840\tUS\tUnited States',
  'GB\tGBR\t826\tUK\tUnited Kingdom',
].join('\n')
const names = parseNames(admin, countries)

describe('normaliseName', () => {
  test.each([
    ['Whangārei', 'whangarei'],
    ['Arthur’s Pass', 'arthurs pass'],
    ['Aoraki / Mount Cook', 'aoraki mount cook'],
    ['Aoraki/Mount Cook', 'aoraki mount cook'],
    ['  St. Arnaud ', 'st arnaud'],
  ])('%s is %s', (name, expected) => {
    expect(normaliseName(name)).toBe(expected)
  })
})

describe('parseRows', () => {
  test('reads the columns that are used', () => {
    const [place] = parseRows(
      row({
        name: 'Queenstown',
        latitude: -45.03,
        longitude: 168.66,
        code: 'PPL',
        country: 'NZ',
        region: 'E9',
        population: 10442,
      }),
    )

    expect(place).toEqual({
      name: 'Queenstown',
      latitude: -45.03,
      longitude: 168.66,
      code: 'PPL',
      country: 'NZ',
      region: 'E9',
      population: 10442,
    })
  })

  test('skips comments, blank lines and rows without a position', () => {
    const text = [
      '# a comment',
      '',
      row({
        name: 'Good',
        latitude: 1,
        longitude: 2,
        code: 'PPL',
        country: 'NZ',
      }),
      row({
        name: 'No position',
        latitude: '',
        longitude: '',
        code: 'PPL',
        country: 'NZ',
      }),
    ].join('\n')

    expect(parseRows(text).map((r) => r.name)).toEqual(['Good'])
  })

  test('a missing population is zero', () => {
    const [place] = parseRows(
      row({
        name: 'Hut',
        latitude: 1,
        longitude: 2,
        code: 'HUT',
        country: 'NZ',
        population: '',
      }),
    )
    expect(place.population).toBe(0)
  })
})

describe('rankOf', () => {
  test('puts a town above a hut above a point', () => {
    const rank = (code) => rankOf({ code, country: 'NZ', population: 0 })
    expect(rank('PPL')).toBeGreaterThan(rank('HUT'))
    expect(rank('HUT')).toBeGreaterThan(rank('PT'))
  })

  test('puts NZ ahead of the same kind of place elsewhere', () => {
    const rank = (country) => rankOf({ code: 'PPL', country, population: 5000 })
    expect(rank('NZ')).toBeGreaterThan(rank('AU'))
  })

  test('counts people a little: a city above a town, not above a different kind', () => {
    const rank = (population) =>
      rankOf({ code: 'PPL', country: 'NZ', population })
    expect(rank(1_000_000)).toBeGreaterThan(rank(10_000))
    expect(rank(1_000_000) - rank(10_000)).toBeLessThan(
      KINDS.PPL[1] - KINDS.HUT[1],
    )
  })

  test('has a kind weight for every kind it keeps', () => {
    for (const [code, [label, weight]] of Object.entries(KINDS)) {
      expect(label, code).toBeTruthy()
      expect(weight, code).toBeGreaterThan(0)
    }
  })
})

describe('contextOf', () => {
  const place = (country, region) => ({ country, region })

  test('is the region in NZ', () => {
    expect(contextOf(place('NZ', 'E9'), names)).toBe('Canterbury')
  })

  test('is just "New Zealand" when GeoNames has no region', () => {
    expect(contextOf(place('NZ', '00'), names)).toBe('New Zealand')
  })

  test('is the region and country abroad', () => {
    expect(contextOf(place('US', 'TX'), names)).toBe('Texas, United States')
  })

  test('is the country when there is no region', () => {
    expect(contextOf(place('GB', '99'), names)).toBe('United Kingdom')
  })

  test('falls back to the code for a country it does not know', () => {
    expect(contextOf(place('ZZ', ''), names)).toBe('ZZ')
  })
})

describe('withoutDuplicates', () => {
  const place = (name, latitude, longitude, rank) => ({
    name,
    latitude,
    longitude,
    rank,
  })

  test('keeps the most important of one name close together', () => {
    const kept = withoutDuplicates([
      place('Lake Wanaka', -44.5, 169.1, 60),
      place('Lake Wanaka', -44.51, 169.12, 80),
      place('Lake Wanaka', -44.49, 169.09, 70),
    ])

    expect(kept).toEqual([place('Lake Wanaka', -44.51, 169.12, 80)])
  })

  test('treats a different spelling of one name as the same', () => {
    const kept = withoutDuplicates([
      place('Aoraki/Mount Cook', -43.59, 170.14, 40),
      place('Aoraki / Mount Cook', -43.595, 170.142, 58),
    ])

    expect(kept.map((p) => p.rank)).toEqual([58])
  })

  test('keeps places of one name that are far apart', () => {
    const kept = withoutDuplicates([
      place('Springfield', 39.8, -89.6, 100),
      place('Springfield', 37.2, -93.3, 100),
    ])

    expect(kept).toHaveLength(2)
  })

  test('keeps different names close together', () => {
    const kept = withoutDuplicates([
      place('Wanaka', -44.7, 169.13, 100),
      place('Lake Wanaka', -44.6, 169.1, 60),
    ])

    expect(kept).toHaveLength(2)
  })
})

describe('buildPlaceData', () => {
  const nzText = [
    row({
      name: 'Queenstown',
      latitude: -45.03,
      longitude: 168.66,
      code: 'PPL',
      country: 'NZ',
      region: 'E9',
      population: 10442,
    }),
    row({
      name: 'Aoraki / Mount Cook',
      latitude: -43.595,
      longitude: 170.142,
      code: 'MT',
      country: 'NZ',
      region: 'E9',
    }),
    row({
      name: 'Aoraki/Mount Cook',
      latitude: -43.59,
      longitude: 170.14,
      code: 'LCTY',
      country: 'NZ',
      region: 'E9',
    }),
    row({
      name: 'Wellington',
      latitude: -41.29,
      longitude: 174.78,
      code: 'PPLC',
      country: 'NZ',
      region: 'G2',
      population: 215000,
    }),
    row({
      name: 'Christchurch',
      latitude: -43.53,
      longitude: 172.64,
      code: 'PPLA2',
      country: 'NZ',
      region: 'E9',
      population: 377000,
    }),
    row({
      name: 'Waiho River',
      latitude: -43.4,
      longitude: 170.2,
      code: 'STM',
      country: 'NZ',
      region: 'E9',
    }),
    row({
      name: 'A Farm',
      latitude: -43.0,
      longitude: 171.0,
      code: 'FRMT',
      country: 'NZ',
      region: 'E9',
    }),
    row({
      name: 'Mistaken',
      latitude: 1,
      longitude: 2,
      code: 'PPL',
      country: 'AU',
    }),
  ].join('\n')
  const worldText = [
    row({
      name: 'London',
      latitude: 51.5,
      longitude: -0.12,
      code: 'PPLC',
      country: 'GB',
      region: 'ENG',
      population: 8_900_000,
    }),
    row({
      name: 'Houston',
      latitude: 29.76,
      longitude: -95.37,
      code: 'PPL',
      country: 'US',
      region: 'TX',
      population: 2_300_000,
    }),
    row({
      name: 'Smallville',
      latitude: 10,
      longitude: 10,
      code: 'PPL',
      country: 'US',
      region: 'TX',
      population: MIN_WORLD_POPULATION - 1,
    }),
    row({
      name: 'Queenstown',
      latitude: -45.03,
      longitude: 168.66,
      code: 'PPL',
      country: 'NZ',
      population: 10442,
    }),
  ].join('\n')
  const build = () =>
    buildPlaceData({
      nzText,
      worldText,
      adminText: admin,
      countryText: countries,
      generated: '2026-10-20',
    })
  const decode = (data) =>
    data.places.map(([name, lat, lon, kind, rank, context]) => ({
      name,
      lat: lat / 1000,
      lon: lon / 1000,
      kind: data.kinds[kind][1],
      rank,
      context: data.contexts[context],
    }))

  test('says where the names come from, and when', () => {
    const data = build()

    expect(data.version).toBe(1)
    expect(data.source).toBe(SOURCE)
    expect(data.source).toMatch(/GeoNames/)
    expect(data.source).toMatch(/CC BY 4\.0/)
    expect(data.generated).toBe('2026-10-20')
  })

  test('keeps NZ towns and the kinds of feature people name, and drops streams and farms', () => {
    const names = decode(build()).map((p) => p.name)

    expect(names).toContain('Queenstown')
    expect(names).toContain('Aoraki / Mount Cook')
    expect(names).not.toContain('Waiho River')
    expect(names).not.toContain('A Farm')
  })

  test('keeps the capital and the seats of districts, which have their own codes', () => {
    const places = decode(build())

    expect(places.find((p) => p.name === 'Wellington')?.kind).toBe('Capital')
    expect(places.find((p) => p.name === 'Christchurch')?.kind).toBe('Town')
  })

  test('takes NZ from the NZ file only, and abroad from the world file only', () => {
    const names = decode(build()).map((p) => p.name)

    expect(names).not.toContain('Mistaken')
    expect(names.filter((n) => n === 'Queenstown')).toHaveLength(1)
  })

  test('keeps towns abroad over 15,000 people, as towns (or capitals) whatever their finer code', () => {
    const places = decode(build())

    expect(places.find((p) => p.name === 'London')?.kind).toBe('Capital')
    expect(places.find((p) => p.name === 'Houston')).toBeDefined()
    expect(places.find((p) => p.name === 'Smallville')).toBeUndefined()
  })

  test('collapses the mountain and the locality of one name to the mountain', () => {
    const matches = decode(build()).filter((p) =>
      p.name.toLowerCase().includes('mount cook'),
    )

    expect(matches).toHaveLength(1)
    expect(matches[0].kind).toBe('Mountain')
  })

  test('says where each place is, to about 100m', () => {
    const queenstown = decode(build()).find((p) => p.name === 'Queenstown')

    expect(queenstown.lat).toBe(-45.03)
    expect(queenstown.lon).toBe(168.66)
    expect(build().places.find(([name]) => name === 'Queenstown')[1]).toBe(
      -45030,
    )
  })

  test('gives each place its region or country', () => {
    const places = decode(build())

    expect(places.find((p) => p.name === 'Queenstown').context).toBe(
      'Canterbury',
    )
    expect(places.find((p) => p.name === 'Houston').context).toBe(
      'Texas, United States',
    )
    expect(places.find((p) => p.name === 'London').context).toBe(
      'England, United Kingdom',
    )
  })

  test('lists the most important first, and the same way every time', () => {
    const first = decode(build())
    const ranks = first.map((p) => p.rank)

    expect(ranks).toEqual([...ranks].sort((a, b) => b - a))
    expect(decode(build())).toEqual(first)
  })

  test('only lists the kinds and contexts it uses', () => {
    const data = build()

    expect(data.kinds.map(([code]) => code)).toEqual([
      'MT',
      'PPL',
      'PPLA2',
      'PPLC',
    ])
    expect(data.contexts).toEqual([
      'Canterbury',
      'England, United Kingdom',
      'Texas, United States',
      'Wellington Region',
    ])
  })
})

describe('serialise', () => {
  test('is valid JSON that reads back as the same data', () => {
    const data = {
      version: 1,
      source: 'x',
      generated: 'today',
      kinds: [['PPL', 'Town']],
      contexts: ['Canterbury'],
      places: [
        ['A', 1, 2, 0, 100, 0],
        ['B', 3, 4, 0, 90, 0],
      ],
    }

    expect(JSON.parse(serialise(data))).toEqual(data)
  })

  test('puts one place on a line, so a refresh reads as a diff of places', () => {
    const text = serialise({
      version: 1,
      source: 'x',
      generated: 'today',
      kinds: [],
      contexts: [],
      places: [
        ['A', 1, 2, 0, 100, 0],
        ['B', 3, 4, 0, 90, 0],
      ],
    })

    expect(text.split('\n')).toContain('["A",1,2,0,100,0],')
    expect(text.split('\n')).toContain('["B",3,4,0,90,0]')
  })
})
