import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseSounding, type SoundingLevel } from './parseSounding'
import { summariseSounding } from './summariseSounding'

const fromFixture = (name: string) =>
  summariseSounding(
    parseSounding(readFileSync(join(__dirname, 'fixtures', name), 'utf8')),
  )

const level = (heightM: number, tempC: number, dewPointC = tempC - 10) =>
  ({
    pressureHpa: 1000,
    heightM,
    tempC,
    dewPointC,
    windFromDeg: 270,
    windKt: 20,
  }) satisfies SoundingLevel

const summarise = (levels: SoundingLevel[], indices = {}) =>
  summariseSounding({ levels, liftedIndex: 3, cape: 0, ...indices })

describe('summariseSounding', () => {
  describe('a complete sounding (Invercargill, 30 Oct 2026, 1am)', () => {
    const summary = fromFixture('invercargill-2026102912.html')

    test('has no gap', () => {
      expect(summary.gapBelowM).toBeUndefined()
    })

    test('finds the freezing level, and the snow level 300 m below it', () => {
      expect(summary.freezing).toEqual({ kind: 'height', m: 970 })
      expect(summary.snowLevelM).toBe(700)
    })

    test('finds the cloud layers, lowest first', () => {
      expect(summary.cloud).toEqual([
        { fromM: 581, toM: 918 },
        { fromM: 1071, toM: 1433 },
      ])
    })

    test('gives the wind at 1, 3 and 5 km', () => {
      expect(summary.winds).toEqual([
        { atKm: 1, compass: 'W', kt: 33 },
        { atKm: 3, compass: 'W', kt: 47 },
        { atKm: 5, compass: 'SW', kt: 56 },
      ])
    })

    test('gives the temperature at 3 km, and says the air is stable', () => {
      expect(summary.tempAt3kmC).toBe(-14)
      expect(summary.stability).toBe('stable')
      expect(summary.inversion).toBe(false)
    })
  })

  describe('a sounding missing its lowest readings (Whenuapai, 28 Oct 2026, 1pm)', () => {
    const summary = fromFixture('whenuapai-2026102800.html')

    test('says where the readings start, to the nearest 100 m', () => {
      expect(summary.gapBelowM).toBe(1500)
    })

    test('still finds a freezing level above the gap', () => {
      expect(summary.freezing).toEqual({ kind: 'height', m: 2110 })
    })

    test('gives no wind for a height with no reading near it', () => {
      expect(summary.winds.map((w) => w.atKm)).toEqual([3, 5])
    })

    test('cannot say whether there is an inversion', () => {
      expect(summary.inversion).toBe(false)
    })
  })

  describe('freezing level', () => {
    test('is at ground level when it is freezing at the ground', () => {
      expect(summarise([level(10, -1), level(500, -4)]).freezing).toEqual({
        kind: 'ground',
      })
    })

    test('is left out when the readings start high and are already freezing', () => {
      const summary = summarise([level(1500, -1), level(2000, -4)])

      expect(summary.freezing).toBeUndefined()
      expect(summary.snowLevelM).toBeUndefined()
    })

    test('is interpolated between levels, to 10 m', () => {
      expect(summarise([level(0, 2), level(400, -2)]).freezing).toEqual({
        kind: 'height',
        m: 200,
      })
    })

    test('puts the snow level no lower than the lowest reading', () => {
      expect(summarise([level(0, 1), level(200, -1)]).snowLevelM).toBe(0)
    })

    test('is left out where the balloon did not measure low enough', () => {
      const summary = summarise([level(1468, 0.1), level(1492, -0.1)])

      expect(summary.freezing).toEqual({ kind: 'height', m: 1480 })
      expect(summary.gapBelowM).toBe(1500)
      expect(summary.snowLevelM).toBeUndefined()
    })
  })

  describe('cloud', () => {
    test('is none when the air is dry all the way up', () => {
      expect(summarise([level(0, 10), level(5000, -20)]).cloud).toEqual([])
    })

    test('merges layers less than 100 m apart, and drops thin ones', () => {
      const levels = [
        level(0, 10, 9),
        level(100, 9, 8),
        level(200, 8, 7),
        level(240, 8, 0),
        level(290, 7, 6),
        level(400, 6, 5),
        level(600, 5, -10),
        level(700, 4, 3),
        level(750, 3, -10),
      ]

      expect(summarise(levels).cloud).toEqual([{ fromM: 0, toM: 400 }])
    })
  })

  test('finds an inversion low down', () => {
    const levels = [
      level(0, 5),
      level(100, 5.5),
      level(200, 6.5),
      level(800, 4),
    ]

    expect(summarise(levels).inversion).toBe(true)
  })

  describe('stability', () => {
    test('is unstable with a low lifted index or a high CAPE', () => {
      expect(summarise([level(0, 10)], { liftedIndex: -2 }).stability).toBe(
        'unstable',
      )
      expect(summarise([level(0, 10)], { cape: 500 }).stability).toBe(
        'unstable',
      )
    })

    test('is left out without both indices', () => {
      expect(
        summarise([level(0, 10)], { liftedIndex: undefined }).stability,
      ).toBeUndefined()
    })
  })
})
