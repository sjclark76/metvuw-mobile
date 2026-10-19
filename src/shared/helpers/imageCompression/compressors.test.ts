import sharp from 'sharp'

import { getCompressorForChart } from './getCompressorForChart'
import {
  radarImageDimensions,
  rainImageDimensions,
  satelliteImageDimensions,
  smallSatelliteImageDimensions,
  smallUpperAirImageDimensions,
} from './imageDimensions'

const CHART = { r: 200, g: 40, b: 40 }
const MARGIN = { r: 30, g: 120, b: 200 }

// A real GIF, big enough for every chart's crop, so sharp does the work: the
// route test mocks the compressors, which hides a wrong crop or format. When a
// chart area is given it is painted in a different colour from the margin, so a
// crop that starts in the wrong place picks up the wrong colour.
async function sourceGif(
  width = 1000,
  height = 900,
  chartArea?: { left: number; top: number; width: number; height: number },
) {
  const base = sharp({
    create: { width, height, channels: 3, background: MARGIN },
  })
  if (!chartArea) return base.gif().toBuffer()

  const chart = await sharp({
    create: {
      width: chartArea.width,
      height: chartArea.height,
      channels: 3,
      background: CHART,
    },
  })
    .png()
    .toBuffer()
  return base
    .composite([{ input: chart, left: chartArea.left, top: chartArea.top }])
    .gif()
    .toBuffer()
}

/** True when the whole image is (close to) the chart colour, with no margin in it. */
async function isAllChart(buffer: Buffer) {
  const { channels } = await sharp(buffer).removeAlpha().stats()
  const mean = channels.map((c) => c.mean)
  const spread = channels.map((c) => c.max - c.min)
  const near = (value: number, target: number) => Math.abs(value - target) < 25
  return (
    near(mean[0], CHART.r) &&
    near(mean[1], CHART.g) &&
    near(mean[2], CHART.b) &&
    spread.every((s) => s < 60)
  )
}

async function describeImage(buffer: Buffer) {
  const { format, width, height } = await sharp(buffer).metadata()
  return { format, width, height }
}

describe('chart compressors', () => {
  test('rain charts are cropped to the chart area as webp', async () => {
    const { primary } = getCompressorForChart('Rain')

    const output = await primary(
      await sourceGif(1000, 900, {
        left: 73,
        top: 116,
        ...rainImageDimensions,
      }),
    )

    expect(await describeImage(output)).toEqual({
      format: 'webp',
      ...rainImageDimensions,
    })
    expect(await isAllChart(output)).toBe(true)
  })

  // Radar images are scaled to the chart width first, then cropped.
  test('radar charts are scaled to the chart width and cropped, as webp', async () => {
    const { primary } = getCompressorForChart('Radar')

    // The chart fills the top 1080 rows of a 1130 px wide image: half size, that
    // is exactly the 565 x 540 crop.
    const output = await primary(
      await sourceGif(1130, 1100, {
        left: 0,
        top: 0,
        width: 1130,
        height: 1080,
      }),
    )
    expect(await isAllChart(output)).toBe(true)
    expect(await describeImage(output)).toEqual({
      format: 'webp',
      ...radarImageDimensions,
    })
  })

  test('satellite charts have a full and a small size', async () => {
    const { primary, small } = getCompressorForChart('Satellite')
    const gif = await sourceGif(1000, 900, {
      left: 0,
      top: 0,
      ...satelliteImageDimensions,
    })

    expect(await isAllChart(await primary(gif))).toBe(true)
    expect(await describeImage(await primary(gif))).toEqual({
      format: 'webp',
      ...satelliteImageDimensions,
    })
    expect(await describeImage(await small!(gif))).toEqual({
      format: 'webp',
      ...smallSatelliteImageDimensions,
    })
  })

  test('upper air charts keep their size as webp, with a small variant', async () => {
    const { primary, small } = getCompressorForChart('Upper Air')
    const gif = await sourceGif(760, 690)

    expect(await describeImage(await primary(gif))).toEqual({
      format: 'webp',
      width: 760,
      height: 690,
    })
    expect(await describeImage(await small!(gif))).toEqual({
      format: 'webp',
      ...smallUpperAirImageDimensions,
    })
  })

  test('only satellite and upper air have a small variant', () => {
    expect('small' in getCompressorForChart('Rain')).toBe(false)
    expect('small' in getCompressorForChart('Radar')).toBe(false)
  })

  test('an image smaller than the crop is rejected, not silently padded', async () => {
    const { primary } = getCompressorForChart('Rain')

    await expect(primary(await sourceGif(100, 100))).rejects.toThrow()
  })

  test('something that is not an image is rejected', async () => {
    const { primary } = getCompressorForChart('Satellite')

    await expect(
      primary(Buffer.from('<html>not a chart</html>')),
    ).rejects.toThrow()
  })

  test('an unsupported chart type is an error', () => {
    expect(() => getCompressorForChart('Tide' as never)).toThrow(
      /unsupported chart type: Tide/,
    )
  })
})
