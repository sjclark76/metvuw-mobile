/** One level of a weather balloon's sounding. */
export interface SoundingLevel {
  pressureHpa: number
  /** Metres above sea level. */
  heightM: number
  tempC: number
  dewPointC: number
  /** Where the wind blows from, in degrees. */
  windFromDeg: number
  windKt: number
}

export interface Sounding {
  /** From the lowest reading up. Empty when the page has no table. */
  levels: SoundingLevel[]
  liftedIndex?: number
  /** Most unstable CAPE, in J/kg. */
  cape?: number
}

const KNOTS_PER_METRE_PER_SECOND = 1.94384

/**
 * The levels and indices in a University of Wyoming sounding page (its
 * TEXT:LIST form): a fixed-width table, `PRES HGHT TEMP DWPT RELH MIXR DRCT
 * SPED ...`, with the indices in a table below it. Its rows have every value; a
 * row with fewer than eight is skipped. The table ends at the first blank line.
 */
export function parseSounding(page: string): Sounding {
  const text = page.replace(/<[^>]*>/g, ' ')
  const lines = text.split('\n')
  const header = lines.findIndex((line) =>
    /^\s*PRES\s+HGHT\s+TEMP\s+DWPT/.test(line),
  )

  const levels: SoundingLevel[] = []
  if (header >= 0) {
    for (const line of lines.slice(header + 1)) {
      if (levels.length > 0 && line.trim() === '') break
      const values = line.trim().split(/\s+/).map(Number)
      if (values.length < 8 || !values.slice(0, 8).every(Number.isFinite)) {
        continue
      }
      const [pressureHpa, heightM, tempC, dewPointC, , , windFromDeg, speed] =
        values
      levels.push({
        pressureHpa,
        heightM,
        tempC,
        dewPointC,
        windFromDeg,
        windKt: Math.round(speed * KNOTS_PER_METRE_PER_SECOND),
      })
    }
  }

  const index = (label: string) => {
    const match = text.match(new RegExp(`${label}\\s+(-?\\d+(?:\\.\\d+)?)`))
    return match ? Number(match[1]) : undefined
  }

  return {
    levels,
    liftedIndex: index('Virtual Lifted Index'),
    cape: index('Most Unstable CAPE'),
  }
}
