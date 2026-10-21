import { bandAt, bandInPatch, RAIN_BANDS } from '.'

describe('RAIN_BANDS', () => {
  test('has the twenty bands of metvuw’s key, 1 mm apart from 1 to 20+', () => {
    expect(RAIN_BANDS).toHaveLength(20)
    expect(RAIN_BANDS.map((band) => band.fromMm)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    )
    expect(RAIN_BANDS.slice(0, 19).map((band) => band.label)).toEqual(
      Array.from({ length: 19 }, (_, i) => String(i + 1)),
    )
    expect(RAIN_BANDS[19].label).toBe('20+')
  })

  test('has the colours of metvuw’s key at its ends and middle', () => {
    expect(RAIN_BANDS[0].hexCode).toBe('#FF00FF')
    expect(RAIN_BANDS[4].hexCode).toBe('#0000FF')
    expect(RAIN_BANDS[8].hexCode).toBe('#00FFFF')
    expect(RAIN_BANDS[12].hexCode).toBe('#00FF00')
    expect(RAIN_BANDS[16].hexCode).toBe('#FFFF00')
    expect(RAIN_BANDS[19].hexCode).toBe('#FF3F00')
  })

  test('has no two bands the same colour', () => {
    expect(new Set(RAIN_BANDS.map((band) => band.hexCode)).size).toBe(20)
  })
})

describe('bandAt', () => {
  test('finds the band of each colour in the key', () => {
    expect(bandAt(0xff, 0x00, 0xff)).toBe(0)
    expect(bandAt(0x00, 0x00, 0xff)).toBe(4)
    expect(bandAt(0xff, 0x3f, 0x00)).toBe(19)
  })

  test('finds nothing for a colour that is not in the key', () => {
    expect(bandAt(0xe6, 0xe6, 0xff)).toBeUndefined() // the chart's background
    expect(bandAt(0xff, 0x00, 0x00)).toBeUndefined() // an isobar
    expect(bandAt(0xfe, 0x00, 0xff)).toBeUndefined() // one step off band 1
  })
})

describe('bandInPatch', () => {
  const pixel = (hexCode: string, alpha = 255) => [
    parseInt(hexCode.slice(1, 3), 16),
    parseInt(hexCode.slice(3, 5), 16),
    parseInt(hexCode.slice(5, 7), 16),
    alpha,
  ]
  const patch = (...pixels: number[][]) => pixels.flat()
  const clear = pixel('#e6e6ff')
  const fill = (hexCode: string, count: number) =>
    Array.from({ length: count }, () => pixel(hexCode))

  test('is undefined for a patch with no rain in it', () => {
    expect(bandInPatch(patch(...fill('#e6e6ff', 25)))).toBeUndefined()
  })

  test('finds the band of a patch that is all one band', () => {
    expect(bandInPatch(patch(...fill('#0000ff', 25)))).toBe(4)
  })

  test('takes the band covering most of the patch', () => {
    expect(
      bandInPatch(
        patch(
          ...fill('#ff00ff', 10),
          ...fill('#00ff00', 5),
          ...fill('#e6e6ff', 10),
        ),
      ),
    ).toBe(0)
  })

  test('takes the heavier of two bands that cover as much', () => {
    expect(
      bandInPatch(
        patch(
          ...fill('#ff00ff', 6),
          ...fill('#0000ff', 6),
          ...fill('#e6e6ff', 13),
        ),
      ),
    ).toBe(4)
  })

  test('counts the rain around the chart’s own markings', () => {
    // A label's white and black over most of the patch, rain at its edges.
    expect(
      bandInPatch(
        patch(
          ...fill('#ffffff', 12),
          ...fill('#000000', 8),
          ...fill('#00ff00', 5),
        ),
      ),
    ).toBe(12)
  })

  test('is undefined when rain only grazes the patch', () => {
    expect(
      bandInPatch(patch(...fill('#0000ff', 2), ...fill('#e6e6ff', 23))),
    ).toBeUndefined()
  })

  test('is not swayed by a stray pixel of a heavier band', () => {
    expect(
      bandInPatch(patch(...fill('#ff00ff', 10), ...fill('#ff3f00', 1), clear)),
    ).toBe(0)
  })

  test('ignores see-through pixels', () => {
    expect(
      bandInPatch(
        patch(...Array.from({ length: 25 }, () => pixel('#ff00ff', 0))),
      ),
    ).toBeUndefined()
  })
})
