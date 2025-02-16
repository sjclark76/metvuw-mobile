import {
  getsBalloonLocationCodeOrDefault,
  isBalloonLocationCode,
} from './balloonLocations'

describe('isBalloonLocationCode', () => {
  it('returns true for valid balloon location code', () => {
    expect(isBalloonLocationCode('93112')).toBe(true)
  })

  it('returns false for invalid balloon location code', () => {
    expect(isBalloonLocationCode('99999')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isBalloonLocationCode('')).toBe(false)
  })
})

describe('getsBalloonLocationCodeOrDefault', () => {
  it('returns default code when input is undefined', () => {
    expect(getsBalloonLocationCodeOrDefault(undefined)).toBe('93112')
  })

  it('returns default code when input is empty string', () => {
    expect(getsBalloonLocationCodeOrDefault('')).toBe('93112')
  })

  it('returns the same code when input is a valid balloon location code', () => {
    expect(getsBalloonLocationCodeOrDefault('93417')).toBe('93417')
  })

  it('returns false when input is an invalid balloon location code', () => {
    expect(getsBalloonLocationCodeOrDefault('99999')).toBe(false)
  })
})
