import { type RegionCode, regions } from '@/shared/types/region'

import { calibrations } from './calibrations'
import { type ChartPosition, positionOnCrop } from './projection'

export type { ChartPosition } from './projection'

/**
 * Where a place is on a region's processed chart, as fractions from 0 to 1 across
 * and down, or undefined if that chart does not show it.
 */
export function chartPosition(
  region: RegionCode,
  latitude: number,
  longitude: number,
): ChartPosition | undefined {
  return positionOnCrop(calibrations[region], latitude, longitude)
}

/** Whether a region's chart shows a place. */
export function regionCovers(
  region: RegionCode,
  latitude: number,
  longitude: number,
): boolean {
  return chartPosition(region, latitude, longitude) !== undefined
}

/** Every region whose chart shows a place, in the order the app lists regions. */
export function regionsCovering(
  latitude: number,
  longitude: number,
): RegionCode[] {
  return regions
    .map((region) => region.code)
    .filter((code) => regionCovers(code, latitude, longitude))
}
