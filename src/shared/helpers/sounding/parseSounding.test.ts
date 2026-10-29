import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseSounding } from './parseSounding'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')

describe('parseSounding', () => {
  test('reads every level of a complete sounding, from the ground up', () => {
    const { levels } = parseSounding(fixture('invercargill-2026102912.html'))

    expect(levels).toHaveLength(3777)
    expect(levels[0]).toEqual({
      pressureHpa: 995.7,
      heightM: 2,
      tempC: 7.3,
      dewPointC: 2.4,
      windFromDeg: 260,
      windKt: 16,
    })
  })

  test('reads the indices under the table', () => {
    const { liftedIndex, cape } = parseSounding(
      fixture('invercargill-2026102912.html'),
    )

    expect(liftedIndex).toBe(2.7)
    expect(cape).toBe(75.4)
  })

  test('starts where the readings start, when the lowest are missing', () => {
    const { levels } = parseSounding(fixture('whenuapai-2026102800.html'))

    expect(levels).toHaveLength(1093)
    expect(levels[0].heightM).toBe(1468)
  })

  test('finds no levels in a page with no table', () => {
    expect(parseSounding('The server is too busy, try again later.')).toEqual({
      levels: [],
      liftedIndex: undefined,
      cape: undefined,
    })
  })

  // Wyoming's rows have all eleven values (checked on 48 soundings); a row cut
  // short is skipped rather than read into the wrong columns.
  test('skips a row cut short, and carries on', () => {
    const page = `
   PRES   HGHT   TEMP   DWPT   RELH   MIXR   DRCT   SPED   THTA   THTE   THTV
    hPa      m      C      C      %   g/kg    deg    m/s      K      K      K
 1000.0     10   15.0   10.0     72   7.80    180    5.0  288.1  310.2  289.5
  990.0    100   14.0    9.5
  980.0    190   13.0    9.0     76   7.50    190    6.0  288.9  310.6  290.2
`
    expect(parseSounding(page).levels.map((l) => l.heightM)).toEqual([10, 190])
  })
})
