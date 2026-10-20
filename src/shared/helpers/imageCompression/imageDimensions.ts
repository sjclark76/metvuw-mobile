import type { ChartType } from '@/shared/types/ChartType'

export const rainImageDimensions = { width: 565, height: 396 }

/**
 * The rectangle cut from every rain chart, in the pixels of the full 711x600
 * chart: the part of the map the app shows. The same rectangle for every region,
 * whatever its map covers, so it clips some charts (and, on the World chart, takes
 * in blank space above the map). Anything that places something on a processed
 * chart (see `chartGeometry`) must use it.
 */
export const rainCrop = { left: 73, top: 116, ...rainImageDimensions }
export const radarImageDimensions = { width: 565, height: 540 }

export const satelliteImageDimensions = { width: 840, height: 607 }
export const smallSatelliteImageDimensions = { width: 300, height: 217 }
export const upperAirImageDimensions = { width: 760, height: 690 }
export const smallUpperAirImageDimensions = { width: 300, height: 272 }

const dimensionsFor = {
  Rain: rainImageDimensions,
  Radar: radarImageDimensions,
  Satellite: satelliteImageDimensions,
  'Upper Air': upperAirImageDimensions,
} as const

/** How tall a chart is for each unit of its width. */
export function chartAspectRatio(chartType: ChartType): number {
  const { width, height } = dimensionsFor[chartType]
  return height / width
}
