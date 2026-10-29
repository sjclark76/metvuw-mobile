import type { Sounding, SoundingLevel } from './parseSounding'

export type Freezing = { kind: 'ground' } | { kind: 'height'; m: number }

export interface CloudLayer {
  fromM: number
  toM: number
}

export interface WindAt {
  atKm: number
  /** Where it blows from. */
  compass: string
  kt: number
}

/** What the "At a glance" panel says. Each fact is absent when the data can't support it. */
export interface SoundingSummary {
  /** Set when the readings start above 500 m: where they start, to 100 m. */
  gapBelowM?: number
  freezing?: Freezing
  /** Lowest first, at most 3. Empty means dry. */
  cloud: CloudLayer[]
  /** False when there is none, or when the readings start too high to tell. */
  inversion: boolean
  winds: WindAt[]
  tempAt3kmC?: number
  stability?: 'stable' | 'unstable'
}

// A balloon whose readings start higher than this has missed the layer where
// fog, low cloud and inversions are, so nothing is said about it.
const LOW_COMPLETE_M = 500
// Air within this of its dew point is close to saturated: cloud.
const CLOUD_SPREAD_C = 3
const CLOUD_MIN_THICKNESS_M = 150
const CLOUD_MERGE_GAP_M = 100
const CLOUD_TOP_M = 9000
const MOST_CLOUD_LAYERS = 3
const INVERSION_BELOW_M = 1500
const INVERSION_RISE_C = 1
const INVERSION_DEPTH_M = 100
const NEAREST_WITHIN_M = 150

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const roundTo = (value: number, step: number) => Math.round(value / step) * step

/** The 8-point compass name for a direction in degrees. */
export function compassPoint(degrees: number): string {
  return COMPASS[Math.round(degrees / 45) % 8]
}

/** The level nearest a height, if one is within 150 m of it. */
export function nearestLevel(
  levels: SoundingLevel[],
  heightM: number,
): SoundingLevel | undefined {
  let nearest: SoundingLevel | undefined
  for (const level of levels) {
    if (
      !nearest ||
      Math.abs(level.heightM - heightM) < Math.abs(nearest.heightM - heightM)
    ) {
      nearest = level
    }
  }
  return nearest && Math.abs(nearest.heightM - heightM) <= NEAREST_WITHIN_M
    ? nearest
    : undefined
}

function freezingLevel(
  levels: SoundingLevel[],
  lowComplete: boolean,
): Freezing | undefined {
  if (levels[0].tempC <= 0) {
    // Freezing at the lowest reading: at the ground only if that is the ground.
    return lowComplete ? { kind: 'ground' } : undefined
  }
  for (let i = 1; i < levels.length; i++) {
    const below = levels[i - 1]
    const above = levels[i]
    if (below.tempC > 0 && above.tempC <= 0) {
      const m =
        below.heightM +
        ((0 - below.tempC) * (above.heightM - below.heightM)) /
          (above.tempC - below.tempC)
      return { kind: 'height', m: roundTo(m, 10) }
    }
  }
  return undefined
}

function cloudLayers(levels: SoundingLevel[]): CloudLayer[] {
  const moist: CloudLayer[] = []
  let current: CloudLayer | undefined
  for (const level of levels) {
    if (level.heightM >= CLOUD_TOP_M) break
    if (level.tempC - level.dewPointC <= CLOUD_SPREAD_C) {
      if (current) current.toM = level.heightM
      else current = { fromM: level.heightM, toM: level.heightM }
    } else if (current) {
      moist.push(current)
      current = undefined
    }
  }
  if (current) moist.push(current)

  const merged: CloudLayer[] = []
  for (const layer of moist) {
    const last = merged.at(-1)
    if (last && layer.fromM - last.toM < CLOUD_MERGE_GAP_M) last.toM = layer.toM
    else merged.push({ ...layer })
  }
  return merged
    .filter((layer) => layer.toM - layer.fromM >= CLOUD_MIN_THICKNESS_M)
    .slice(0, MOST_CLOUD_LAYERS)
}

function hasInversion(levels: SoundingLevel[]): boolean {
  const low = levels.filter((level) => level.heightM < INVERSION_BELOW_M)
  for (let i = 0; i < low.length; i++) {
    for (let j = i + 1; j < low.length; j++) {
      if (
        low[j].heightM - low[i].heightM >= INVERSION_DEPTH_M &&
        low[j].tempC - low[i].tempC >= INVERSION_RISE_C
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * What a sounding says, in the terms the panel uses. `sounding.levels` must not
 * be empty (fetchSounding only returns soundings with levels).
 */
export function summariseSounding(sounding: Sounding): SoundingSummary {
  const { levels, liftedIndex, cape } = sounding
  const lowestM = levels[0].heightM
  const lowComplete = lowestM <= LOW_COMPLETE_M

  // No snow level: a balloon measures the air, not whether anything will fall,
  // so a snow level would read as a forecast.
  const freezing = freezingLevel(levels, lowComplete)

  const winds = [1, 3, 5].flatMap((atKm) => {
    const level = nearestLevel(levels, atKm * 1000)
    return level
      ? [{ atKm, compass: compassPoint(level.windFromDeg), kt: level.windKt }]
      : []
  })

  return {
    gapBelowM: lowComplete ? undefined : roundTo(lowestM, 100),
    freezing,
    cloud: cloudLayers(levels),
    inversion: lowComplete && hasInversion(levels),
    winds,
    tempAt3kmC: nearestLevel(levels, 3000)?.tempC,
    stability:
      liftedIndex === undefined || cape === undefined
        ? undefined
        : liftedIndex <= -2 || cape >= 500
          ? 'unstable'
          : 'stable',
  }
}
