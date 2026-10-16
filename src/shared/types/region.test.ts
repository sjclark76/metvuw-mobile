import {
  australiaRegions,
  europeRegions,
  findRegionByCode,
  getByRegionCode,
  nzRegions,
  oceans,
  pacificRegions,
  regions,
  worldRegions,
} from './region'

const pairs = (list: readonly { code: string; name: string }[]) =>
  list.map(({ code, name }) => `${code}: ${name}`)

describe('regions', () => {
  test('every code is listed once', () => {
    const codes = regions.map((r) => r.code)

    expect(new Set(codes).size).toBe(codes.length)
  })

  test('finds a region by its code', () => {
    expect(findRegionByCode('nzsi')).toEqual({
      name: 'South Island',
      code: 'nzsi',
    })
    expect(findRegionByCode('nope')).toBeUndefined()
  })

  test('getByRegionCode throws for an unknown code', () => {
    expect(() => getByRegionCode('nope')).toThrow(/nope/)
  })

  // The navigation menus list these groups in this order.
  describe('groups', () => {
    test('New Zealand', () => {
      expect(pairs(nzRegions)).toEqual([
        'nz: New Zealand',
        'nzni: North Island',
        'nzsi: South Island',
      ])
    })

    test('Australia', () => {
      expect(pairs(australiaRegions)).toEqual([
        'victoria: Victoria & Tasmania',
        'nsw: New South Wales',
        'waussie: Western Australia',
        'swaussie: Perth',
        'queensland: Queensland',
        'saussie: South Australia',
        'seaussie: South East Australia',
      ])
    })

    test('Pacific', () => {
      expect(pairs(pacificRegions)).toEqual([
        'newcaledonia: New Caledonia',
        'fiji: Fiji Islands',
        'swp: South West Pacific',
      ])
    })

    test('Europe', () => {
      expect(pairs(europeRegions)).toEqual([
        'europe: Europe',
        'uk: United Kingdom',
        'estonia: Estonia',
        'turkey: Turkey',
      ])
    })

    test('World', () => {
      expect(pairs(worldRegions)).toEqual([
        'world: World',
        'satlantic: South Atlantic',
        'natlantic: North Atlantic',
        'usa: USA',
        'japan: Japan',
        'safrica: South Africa',
      ])
    })

    test('Oceans', () => {
      expect(pairs(oceans)).toEqual([
        'ocean: New Zealand to Fiji',
        'pacific: Pacific Islands',
        'fiji: Fiji Islands',
        'spacific: South Pacific',
        'pitcairn: Pitcairn Island',
        'natlantic: North Atlantic',
        'satlantic: South Atlantic',
      ])
    })

    test('every group member is the master region, not a copy that can drift', () => {
      const groups = [
        nzRegions,
        australiaRegions,
        pacificRegions,
        europeRegions,
        worldRegions,
        oceans,
      ]

      for (const region of groups.flat()) {
        expect(region).toBe(getByRegionCode(region.code))
      }
    })

    test('every region appears in at least one group', () => {
      const grouped = new Set(
        [
          nzRegions,
          australiaRegions,
          pacificRegions,
          europeRegions,
          worldRegions,
          oceans,
        ]
          .flat()
          .map((r) => r.code),
      )

      expect(regions.map((r) => r.code).filter((c) => !grouped.has(c))).toEqual(
        [],
      )
    })
  })
})
