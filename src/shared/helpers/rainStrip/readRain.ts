import type { ChartPosition } from '@/shared/helpers/chartGeometry'
import { bandInPatch } from '@/shared/helpers/rainBands'

/** What a chart shows at one place. `band` indexes RAIN_BANDS. */
export type RainReading =
  { kind: 'offChart' } | { kind: 'clear' } | { kind: 'rain'; band: number }

export interface DecodedChart {
  width: number
  height: number
  /** RGBA bytes, row by row. */
  data: ArrayLike<number>
}

// Half the side of the patch read around a place: a 5 by 5 patch.
const PATCH_RADIUS = 2

function patchAround(chart: DecodedChart, position: ChartPosition) {
  const centreX = Math.round(position.x * (chart.width - 1))
  const centreY = Math.round(position.y * (chart.height - 1))
  const pixels: number[] = []
  for (let y = centreY - PATCH_RADIUS; y <= centreY + PATCH_RADIUS; y++) {
    for (let x = centreX - PATCH_RADIUS; x <= centreX + PATCH_RADIUS; x++) {
      if (x < 0 || y < 0 || x >= chart.width || y >= chart.height) continue
      const at = (y * chart.width + x) * 4
      pixels.push(
        chart.data[at],
        chart.data[at + 1],
        chart.data[at + 2],
        chart.data[at + 3],
      )
    }
  }
  return pixels
}

/**
 * What a decoded chart shows at each place: the heaviest band of rain in a small
 * patch around it, clear if there is none, or off the chart for a place the chart
 * does not show (`undefined` position).
 */
export function readRain(
  chart: DecodedChart,
  positions: Record<string, ChartPosition | undefined>,
): Record<string, RainReading> {
  const readings: Record<string, RainReading> = {}
  for (const [id, position] of Object.entries(positions)) {
    if (!position) {
      readings[id] = { kind: 'offChart' }
      continue
    }
    const band = bandInPatch(patchAround(chart, position))
    readings[id] =
      band === undefined ? { kind: 'clear' } : { kind: 'rain', band }
  }
  return readings
}

/**
 * Fetches and decodes a chart image, off the main thread where the browser can
 * (the decode is the slow part). The image is the one the page already loaded, so
 * this is normally answered from the cache.
 */
export async function decodeChart(
  url: string,
  signal?: AbortSignal,
): Promise<DecodedChart> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`chart not available: ${response.status}`)
  const bitmap = await createImageBitmap(await response.blob())
  try {
    const { width, height } = bitmap
    const canvas =
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), { width, height })
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('no canvas')
    context.drawImage(bitmap, 0, 0)
    return {
      width,
      height,
      data: context.getImageData(0, 0, width, height).data,
    }
  } finally {
    bitmap.close()
  }
}
