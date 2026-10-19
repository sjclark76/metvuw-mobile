/**
 * Geometry for the footer's time axis. Charts sit at equal steps along the axis
 * (that is what the range input underneath does), so a position here is a
 * fractional chart index: 1.5 is halfway between the second and third chart.
 */

const SEARCH_STEP_MS = 60 * 1000

export interface DayBoundary {
  /** Fractional chart index where the local day changes. */
  position: number
  /** Name of the day that starts there. */
  label: string
}

/**
 * Where each local day begins, between the two charts either side of midnight.
 * `dayOf` names a day in the viewer's zone, so it is the caller's to choose.
 */
export function dayBoundaries(
  times: readonly number[],
  {
    dayOf,
    labelOf,
  }: { dayOf: (time: number) => string; labelOf: (time: number) => string },
): DayBoundary[] {
  const boundaries: DayBoundary[] = []

  for (let i = 1; i < times.length; i++) {
    const before = times[i - 1]
    const after = times[i]
    if (dayOf(before) === dayOf(after)) continue

    // Walk forward from the earlier chart to the first minute of the new day.
    let midnight = before
    while (midnight < after && dayOf(midnight) === dayOf(before)) {
      midnight += SEARCH_STEP_MS
    }
    const span = after - before
    const fraction = span > 0 ? Math.min((midnight - before) / span, 1) : 1
    boundaries.push({ position: i - 1 + fraction, label: labelOf(after) })
  }

  return boundaries
}

/**
 * Where the current moment falls along the axis, or undefined when it is
 * outside the charts' range (or there are fewer than two charts to place it
 * between).
 */
export function nowPosition(
  times: readonly number[],
  now: number,
): number | undefined {
  if (times.length < 2 || now < times[0] || now > times[times.length - 1]) {
    return undefined
  }

  for (let i = 0; i < times.length - 1; i++) {
    if (now <= times[i + 1]) {
      const span = times[i + 1] - times[i]
      return i + (span > 0 ? (now - times[i]) / span : 0)
    }
  }
  return undefined
}
