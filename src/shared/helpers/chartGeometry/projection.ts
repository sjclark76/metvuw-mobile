import { rainCrop } from '@/shared/helpers/imageCompression/imageDimensions'

/**
 * How one region's chart maps places to pixels, in the pixels of the full 711x600
 * chart. Every chart is a Mercator map:
 *
 *   x = x0 + perDegree * longitude
 *   y = y0 + perMercator * ln(tan(pi/4 + latitude/2))
 *
 * The two scales are fitted separately, not assumed equal: measured, they differ
 * by 0.2 to 0.8%.
 */
export interface Calibration {
  x0: number
  perDegree: number
  y0: number
  perMercator: number
}

/** Where a place is on a processed chart: fractions from 0 to 1, across and down. */
export interface ChartPosition {
  x: number
  y: number
}

/** The plot area's left edge in every chart, in full-chart pixels. */
export const PLOT_LEFT = 71

/** Beyond this the Mercator map has no useful room for a place. */
export const MAX_LATITUDE = 85

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export function mercator(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + toRadians(latitude) / 2))
}

/**
 * Where a place is on the full chart, in pixels (nothing clipped). The longitude
 * is moved into the 360 degrees that start at the chart's west edge, so 179W and
 * 181E are the same place on a chart that crosses 180. (A chart a little wider than
 * 360, the World chart, shows a place in its overlap at the west.)
 */
export function chartPixels(
  calibration: Calibration,
  latitude: number,
  longitude: number,
): { x: number; y: number } {
  const west = (PLOT_LEFT - calibration.x0) / calibration.perDegree
  const wrapped = west + ((((longitude - west) % 360) + 360) % 360)
  return {
    x: calibration.x0 + calibration.perDegree * wrapped,
    y: calibration.y0 + calibration.perMercator * mercator(latitude),
  }
}

/**
 * Where a place is on the processed chart (the crop the app shows), or undefined
 * when it is not there: off the map, in a sliver the crop removes, or not a place
 * a Mercator map can show.
 */
export function positionOnCrop(
  calibration: Calibration,
  latitude: number,
  longitude: number,
): ChartPosition | undefined {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > MAX_LATITUDE
  ) {
    return undefined
  }
  const pixels = chartPixels(calibration, latitude, longitude)
  const x = (pixels.x - rainCrop.left) / rainCrop.width
  const y = (pixels.y - rainCrop.top) / rainCrop.height
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : undefined
}
