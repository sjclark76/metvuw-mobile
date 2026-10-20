import { RAIN_BANDS } from '.'

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
