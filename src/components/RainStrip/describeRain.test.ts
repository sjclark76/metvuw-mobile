import { ALL_PINS, chosenPins, describeRain } from './describeRain'

describe('describeRain', () => {
  test('says a band as the range of rain it stands for', () => {
    expect(describeRain({ kind: 'rain', band: 0 })).toBe('1–2 mm in 6 hr')
    expect(describeRain({ kind: 'rain', band: 4 })).toBe('5–6 mm in 6 hr')
    expect(describeRain({ kind: 'rain', band: 18 })).toBe('19–20 mm in 6 hr')
  })

  test('says the heaviest band is that much or more', () => {
    expect(describeRain({ kind: 'rain', band: 19 })).toBe('20+ mm in 6 hr')
  })

  test('says clear as under 1 mm, which is all the chart can say', () => {
    expect(describeRain({ kind: 'clear' })).toBe('under 1 mm')
  })

  test('says when a place is not on the chart or has not been read', () => {
    expect(describeRain({ kind: 'offChart' })).toBe('not on this chart')
    expect(describeRain(undefined)).toBe('not read yet')
  })
})

describe('chosenPins', () => {
  const pins = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  test('is every pin for all pins', () => {
    expect(chosenPins(pins, ALL_PINS)).toEqual(pins)
  })

  test('is the pin chosen', () => {
    expect(chosenPins(pins, 'b')).toEqual([{ id: 'b' }])
  })

  test('is the first pin when the one chosen is gone, or none was chosen', () => {
    expect(chosenPins(pins, 'gone')).toEqual([{ id: 'a' }])
    expect(chosenPins([], 'gone')).toEqual([])
  })
})
