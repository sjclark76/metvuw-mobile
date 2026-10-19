import { isRadarCode, radarRegions } from './radarRegions'

describe('isRadarCode', () => {
  test('accepts every radar code the app has', () => {
    for (const code of Object.keys(radarRegions)) {
      expect(isRadarCode(code)).toBe(true)
    }
  })

  test.each([
    '',
    'NL',
    'xx',
    'nl ',
    'nlx',
    'constructor',
    '__proto__',
    'toString',
  ])('rejects %j', (value) => {
    expect(isRadarCode(value)).toBe(false)
  })

  test('names every radar', () => {
    expect(radarRegions.nl).toBe('Northland')
    expect(Object.keys(radarRegions)).toHaveLength(9)
  })
})
