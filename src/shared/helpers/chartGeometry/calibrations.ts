import type { RegionCode } from '@/shared/types/region'

import data from './calibrations.json'
import type { Calibration } from './projection'

/**
 * The map of every region's chart. Generated, not written by hand: see
 * `scripts/chart-geometry/measure.mjs`, which measures the real charts. Typed as a
 * record over every region code, so a region added to the app without a
 * calibration does not compile.
 */
export const calibrations: Record<RegionCode, Calibration> = data
