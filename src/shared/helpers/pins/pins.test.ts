import type { Place } from '@/shared/helpers/places'

import {
  addPin,
  chartLabel,
  chartsShowing,
  MAX_LABEL_LENGTH,
  type Pin,
  pinFromPlace,
  pinId,
  removePin,
  sanitizePins,
  setPinLabel,
  tidyLabel,
} from './pins'

const wanaka: Place = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}
const hooker: Place = {
  name: 'Hooker Hut',
  context: 'Canterbury',
  kind: 'Hut',
  latitude: -43.6,
  longitude: 170,
}

describe('pinId', () => {
  test('is the name and the position to about 100m', () => {
    expect(pinId(wanaka)).toBe('Wanaka|-44.703|169.132')
  })

  test('is the same for places that differ by less than that', () => {
    expect(pinId({ ...wanaka, latitude: -44.70301 })).toBe(pinId(wanaka))
  })

  test('tells two places of one name apart', () => {
    expect(pinId({ ...wanaka, latitude: -31, longitude: 26 })).not.toBe(
      pinId(wanaka),
    )
  })
})

describe('tidyLabel', () => {
  test.each([
    ['Home', 'Home'],
    ['  Home  ', 'Home'],
    ['', undefined],
    ['   ', undefined],
  ])('%j is %j', (label, expected) => {
    expect(tidyLabel(label)).toBe(expected)
  })

  test('is no longer than a chart has room for', () => {
    const long = 'x'.repeat(MAX_LABEL_LENGTH + 10)

    expect(tidyLabel(long)).toHaveLength(MAX_LABEL_LENGTH)
  })

  test('does not leave a space at the end where it was cut', () => {
    const label = `${'a'.repeat(MAX_LABEL_LENGTH - 1)} b`

    expect(tidyLabel(label)).toBe('a'.repeat(MAX_LABEL_LENGTH - 1))
  })

  test('is twenty characters', () => {
    expect(MAX_LABEL_LENGTH).toBe(20)
  })
})

describe('addPin', () => {
  test('pins a place, using its own name and no label', () => {
    const [pin] = addPin([], wanaka)

    expect(pin).toEqual({
      id: 'Wanaka|-44.703|169.132',
      name: 'Wanaka',
      context: 'Otago',
      kind: 'Town',
      latitude: -44.703,
      longitude: 169.132,
    })
    expect(pin.label).toBeUndefined()
  })

  test('adds to the end, keeping the others', () => {
    const pins = addPin(addPin([], wanaka), hooker)

    expect(pins.map((pin) => pin.name)).toEqual(['Wanaka', 'Hooker Hut'])
  })

  test('does not pin the same place twice', () => {
    const once = addPin([], wanaka)

    expect(addPin(once, wanaka)).toBe(once)
  })

  test('does not change the pins it was given', () => {
    const before: Pin[] = []
    addPin(before, wanaka)

    expect(before).toEqual([])
  })
})

describe('removePin', () => {
  test('removes just that pin', () => {
    const pins = addPin(addPin([], wanaka), hooker)

    expect(removePin(pins, pinId(wanaka)).map((pin) => pin.name)).toEqual([
      'Hooker Hut',
    ])
  })

  test('leaves the pins alone when there is no such pin', () => {
    const pins = addPin([], wanaka)

    expect(removePin(pins, 'nope')).toEqual(pins)
  })
})

describe('setPinLabel', () => {
  const pins = addPin(addPin([], wanaka), hooker)

  test('gives one pin a label, and only that one', () => {
    const labelled = setPinLabel(pins, pinId(wanaka), 'Home')

    expect(labelled[0].label).toBe('Home')
    expect(labelled[1].label).toBeUndefined()
  })

  test('tidies the label', () => {
    expect(setPinLabel(pins, pinId(wanaka), '  Home  ')[0].label).toBe('Home')
    expect(
      setPinLabel(pins, pinId(wanaka), 'x'.repeat(40))[0].label,
    ).toHaveLength(MAX_LABEL_LENGTH)
  })

  test('clears the label when it is blank', () => {
    const labelled = setPinLabel(pins, pinId(wanaka), 'Home')

    const cleared = setPinLabel(labelled, pinId(wanaka), '   ')

    expect('label' in cleared[0]).toBe(false)
  })

  test('does not change the pins it was given', () => {
    setPinLabel(pins, pinId(wanaka), 'Home')

    expect(pins[0].label).toBeUndefined()
  })
})

describe('chartLabel', () => {
  test('is the full name when there is no label', () => {
    expect(chartLabel(pinFromPlace(wanaka))).toBe('Wanaka')
  })

  test('is the label when there is one', () => {
    expect(chartLabel({ ...pinFromPlace(wanaka), label: 'Home' })).toBe('Home')
  })
})

describe('sanitizePins', () => {
  const good = pinFromPlace(wanaka)

  test('keeps good pins, in order', () => {
    const second = pinFromPlace(hooker)

    expect(sanitizePins([good, second])).toEqual([good, second])
  })

  test.each([undefined, null, 'x', 7, {}, { 0: pinFromPlace(wanaka) }])(
    'is empty when what was stored is %j, not a list',
    (stored) => {
      expect(sanitizePins(stored)).toEqual([])
    },
  )

  test('drops entries that are not pins, and keeps the rest', () => {
    expect(
      sanitizePins([
        null,
        'x',
        { ...good, name: '' },
        { ...good, name: 7 },
        { ...good, latitude: '1' },
        { ...good, latitude: NaN },
        { ...good, latitude: 91 },
        { ...good, longitude: 181 },
        { ...good, longitude: Infinity },
        good,
      ]),
    ).toEqual([good])
  })

  test('works the id out again, not trusting the stored one', () => {
    expect(sanitizePins([{ ...good, id: 'something else' }])[0].id).toBe(
      good.id,
    )
  })

  test('keeps one pin for a place stored twice', () => {
    expect(sanitizePins([good, { ...good, label: 'Home' }])).toEqual([good])
  })

  test('tidies a label, and drops one that is not text', () => {
    expect(sanitizePins([{ ...good, label: '  Home  ' }])[0].label).toBe('Home')
    expect(
      sanitizePins([{ ...good, label: 'x'.repeat(99) }])[0].label,
    ).toHaveLength(MAX_LABEL_LENGTH)
    expect(sanitizePins([{ ...good, label: 5 }])[0].label).toBeUndefined()
    expect(sanitizePins([{ ...good, label: '   ' }])[0].label).toBeUndefined()
  })

  test('copes with a missing context or kind', () => {
    const { context: _c, kind: _k, ...bare } = good
    void _c
    void _k

    expect(sanitizePins([bare])[0]).toMatchObject({ context: '', kind: '' })
  })
})

describe('chartsShowing', () => {
  test('lists the region charts that cover a pin, with links to them', () => {
    const charts = chartsShowing(pinFromPlace(wanaka))

    expect(charts.map((chart) => chart.code)).toEqual(
      expect.arrayContaining(['nz', 'nzsi', 'world']),
    )
    expect(charts.find((chart) => chart.code === 'nzsi')).toEqual({
      code: 'nzsi',
      name: 'South Island',
      href: '/regions/nzsi',
    })
  })

  test('does not list a chart that does not cover it', () => {
    const codes = chartsShowing(pinFromPlace(wanaka)).map((chart) => chart.code)

    expect(codes).not.toContain('europe')
    expect(codes).not.toContain('usa')
  })

  test('lists them in the order the app lists regions', () => {
    const codes = chartsShowing(pinFromPlace(wanaka)).map((chart) => chart.code)

    expect(codes.indexOf('nz')).toBeLessThan(codes.indexOf('nzsi'))
    expect(codes.indexOf('nzsi')).toBeLessThan(codes.indexOf('world'))
  })

  test('is empty for a place no chart shows', () => {
    expect(
      chartsShowing({ ...pinFromPlace(wanaka), latitude: 88, longitude: 0 }),
    ).toEqual([])
  })
})
