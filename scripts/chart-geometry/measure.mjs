/* eslint-disable no-console -- a command-line tool: printing is its output */
// Measures every region's chart and writes the calibration the app uses:
//
//   node scripts/chart-geometry/measure.mjs [--dir <folder of <code>.gif files>]
//
// With no --dir it fetches one current chart per region from metvuw.com. Writes
// calibrations.json (the map for each region) and measurements.json (the tick
// positions they were fitted to, which the tests check the map against) into
// src/shared/helpers/chartGeometry/. Exits with an error if any region's fit is
// worse than 1px, or a tick or label could not be found.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  LATITUDES,
  LONGITUDE_SEEDS,
  LONGITUDES,
  REGION_CODES,
} from './labels.mjs'
import { loadChart, measureChart } from './lib.mjs'

export const OUTPUT_DIRECTORY = 'src/shared/helpers/chartGeometry'
export const MAX_MISS_PX = 1

/** One current rain chart for a region, from metvuw.com's own listing. */
export async function fetchChart(code) {
  const listing = await (
    await fetch(
      `https://metvuw.com/forecast/forecast.php?type=rain&region=${code}`,
    )
  ).text()
  const match = listing.match(
    new RegExp(`[0-9]{10}/rain-${code}-[a-z]*-?[0-9]{10}-006\\.gif`),
  )
  if (!match) throw new Error(`no chart listed for ${code}`)
  const response = await fetch(`https://metvuw.com/forecast/${match[0]}`)
  if (!response.ok) throw new Error(`${code}: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

export async function chartFor(code, directory) {
  return directory
    ? readFile(path.join(directory, `${code}.gif`))
    : fetchChart(code)
}

export const inputsFor = (code) => ({
  latitudes: LATITUDES[code],
  longitudes: LONGITUDES[code],
  longitudeSeed: LONGITUDE_SEEDS[code],
})

const round = (value, places) => Math.round(value * 10 ** places) / 10 ** places

async function main() {
  const directoryFlag = process.argv.indexOf('--dir')
  const directory =
    directoryFlag > -1 ? process.argv[directoryFlag + 1] : undefined

  const calibrations = {}
  const measurements = {}
  let failed = false
  for (const code of REGION_CODES) {
    try {
      const image = await loadChart(await chartFor(code, directory))
      const m = measureChart(image, inputsFor(code))
      const miss = Math.max(m.latitudeMiss, m.longitudeMiss)
      const complete =
        m.found.latitude === LATITUDES[code].length &&
        m.found.longitude === LONGITUDES[code].length
      if (miss > MAX_MISS_PX || !complete) failed = true
      calibrations[code] = {
        x0: round(m.x0, 4),
        perDegree: round(m.perDegree, 4),
        y0: round(m.y0, 4),
        perMercator: round(m.perMercator, 4),
      }
      measurements[code] = {
        latitude: m.latitudeTicks.map(([v, y]) => [v, round(y, 2)]),
        longitude: m.longitudeTicks.map(([v, x]) => [v, round(x, 2)]),
      }
      console.log(
        `${code.padEnd(13)} lat ${m.found.latitude}/${LATITUDES[code].length} miss ${m.latitudeMiss.toFixed(2)}px   lon ${m.found.longitude}/${LONGITUDES[code].length} miss ${m.longitudeMiss.toFixed(2)}px${miss > MAX_MISS_PX || !complete ? '   <-- CHECK' : ''}`,
      )
    } catch (error) {
      failed = true
      console.log(`${code.padEnd(13)} FAILED: ${error.message}`)
    }
  }
  if (failed) {
    console.error(
      '\nSome regions did not measure cleanly; nothing was written.',
    )
    process.exit(1)
  }
  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  const json = (value) => `${JSON.stringify(value, null, 2)}\n`
  await writeFile(
    path.join(OUTPUT_DIRECTORY, 'calibrations.json'),
    json(calibrations),
  )
  await writeFile(
    path.join(OUTPUT_DIRECTORY, 'measurements.json'),
    json(measurements),
  )
  console.log(`\nWrote ${REGION_CODES.length} regions to ${OUTPUT_DIRECTORY}/`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
