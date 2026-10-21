import { RADAR_BANDS } from '.'

describe('RADAR_BANDS', () => {
  test('has the twelve colours of metvuw’s key', () => {
    expect(RADAR_BANDS).toHaveLength(12)
    expect(new Set(RADAR_BANDS.map((band) => band.hexCode)).size).toBe(12)
  })

  test('runs from -5 to 70 dBZ with no gap or overlap', () => {
    expect(RADAR_BANDS[0].fromDbz).toBe(-5)
    expect(RADAR_BANDS[11].toDbz).toBe(70)
    RADAR_BANDS.slice(1).forEach((band, index) => {
      expect(band.fromDbz).toBe(RADAR_BANDS[index].toDbz)
    })
  })

  test('has the colours of metvuw’s key at its ends and in the middle', () => {
    expect(RADAR_BANDS[0].hexCode).toBe('#5F6BB1')
    expect(RADAR_BANDS[5].hexCode).toBe('#FFFF00')
    expect(RADAR_BANDS[8].hexCode).toBe('#FF0000')
    expect(RADAR_BANDS[11].hexCode).toBe('#0000FF')
  })

  test('groups them as metvuw does: 4 light, 5 medium, 3 heavy', () => {
    const count = (group: string) =>
      RADAR_BANDS.filter((band) => band.group === group).length
    expect(count('light')).toBe(4)
    expect(count('medium')).toBe(5)
    expect(count('heavy')).toBe(3)
  })

  test('puts the groups in order, light then medium then heavy', () => {
    expect(RADAR_BANDS.map((band) => band.group)).toEqual([
      ...Array(4).fill('light'),
      ...Array(5).fill('medium'),
      ...Array(3).fill('heavy'),
    ])
  })
})
