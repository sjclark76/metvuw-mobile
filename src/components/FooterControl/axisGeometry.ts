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
 * Which charts get a tick. Forty charts across a phone leave the ticks a few
 * pixels apart, which blurs into a barcode, so only every few are drawn, evenly,
 * as many as leave `minSpacing` pixels between them. The last chart keeps its
 * tick only when there is room for it. Every chart is still reachable: ticks are
 * decoration, the slider underneath has a step for each chart.
 */
export function visibleTicks(
  count: number,
  width: number,
  minSpacing: number,
): number[] {
  if (count <= 0) return []
  if (count === 1 || width <= 0) return [0]

  const last = count - 1
  const pixelsPerChart = width / last
  const stride = Math.max(1, Math.ceil(minSpacing / pixelsPerChart))

  const ticks: number[] = []
  for (let i = 0; i <= last; i += stride) ticks.push(i)

  const lastTick = ticks[ticks.length - 1]
  if (lastTick !== last && (last - lastTick) * pixelsPerChart >= minSpacing) {
    ticks.push(last)
  }
  return ticks
}

/**
 * Which days get their name written. Nine days across a phone leave the names
 * touching ("THUFRI SAT SUNMON"), so a name is skipped when the last one written
 * is closer than `minSpacing` pixels. Every day keeps its line; only the names
 * are thinned. Returns the positions of the days to name.
 */
export function namedDays(
  days: readonly DayBoundary[],
  pixelsPerChart: number,
  minSpacing: number,
): Set<number> {
  const named = new Set<number>()
  let lastAt = Number.NEGATIVE_INFINITY
  for (const day of days) {
    const at = day.position * pixelsPerChart
    if (at - lastAt >= minSpacing) {
      named.add(day.position)
      lastAt = at
    }
  }
  return named
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
