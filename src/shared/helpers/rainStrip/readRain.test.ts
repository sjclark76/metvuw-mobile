import { type DecodedChart, readRain } from './readRain'

const BACKGROUND = [0xe6, 0xe6, 0xff, 255]
const MAGENTA = [0xff, 0x00, 0xff, 255] // band 1: index 0
const GREEN = [0x00, 0xff, 0x00, 255] // band 13: index 12

// A chart of the given size, all background, with some blocks painted.
function chart(
  width: number,
  height: number,
  blocks: { x: number; y: number; size: number; colour: number[] }[] = [],
): DecodedChart {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) data.set(BACKGROUND, i * 4)
  for (const { x, y, size, colour } of blocks) {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        data.set(colour, ((y + dy) * width + x + dx) * 4)
      }
    }
  }
  return { width, height, data }
}

describe('readRain', () => {
  test('reads the band of rain at a place', () => {
    const c = chart(100, 100, [{ x: 40, y: 40, size: 20, colour: GREEN }])

    expect(readRain(c, { a: { x: 0.5, y: 0.5 } })).toEqual({
      a: { kind: 'rain', band: 12 },
    })
  })

  test('reads clear where there is no rain', () => {
    const c = chart(100, 100)

    expect(readRain(c, { a: { x: 0.5, y: 0.5 } })).toEqual({
      a: { kind: 'clear' },
    })
  })

  test('says off the chart for a place the chart does not show', () => {
    expect(readRain(chart(100, 100), { a: undefined })).toEqual({
      a: { kind: 'offChart' },
    })
  })

  test('reads each place on its own', () => {
    const c = chart(100, 100, [
      { x: 10, y: 10, size: 10, colour: MAGENTA },
      { x: 70, y: 70, size: 10, colour: GREEN },
    ])

    expect(
      readRain(c, {
        a: { x: 15 / 99, y: 15 / 99 },
        b: { x: 75 / 99, y: 75 / 99 },
        c: { x: 0.5, y: 0.5 },
      }),
    ).toEqual({
      a: { kind: 'rain', band: 0 },
      b: { kind: 'rain', band: 12 },
      c: { kind: 'clear' },
    })
  })

  test('sees a shower the place is on the edge of, not only the pixel it is on', () => {
    const c = chart(100, 100, [{ x: 50, y: 40, size: 20, colour: GREEN }])

    // 2 pixels left of the shower: its patch reaches in.
    expect(readRain(c, { a: { x: 48 / 99, y: 50 / 99 } }).a).toEqual({
      kind: 'rain',
      band: 12,
    })
    // 5 pixels left: it does not.
    expect(readRain(c, { a: { x: 45 / 99, y: 50 / 99 } }).a).toEqual({
      kind: 'clear',
    })
  })

  test('reads a place at the very edge of the chart', () => {
    const c = chart(100, 100, [{ x: 0, y: 0, size: 10, colour: MAGENTA }])

    expect(readRain(c, { a: { x: 0, y: 0 } }).a).toEqual({
      kind: 'rain',
      band: 0,
    })
    expect(readRain(c, { a: { x: 1, y: 1 } }).a).toEqual({ kind: 'clear' })
  })
})
