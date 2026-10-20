/* eslint-disable no-console -- a command-line tool: printing is its output */
// Checks the calibration the app uses against the charts metvuw.com publishes now:
//
//   node scripts/chart-geometry/verify.mjs [--dir <folder of <code>.gif files>]
//
// Measures one current chart per region from scratch, and compares where its tick
// marks really are with where the committed calibration says they are. Exits with
// an error if any region is more than 1px out, or its chart cannot be read: that
// means metvuw has changed how a chart is drawn, and pins would be misplaced.
// Run by hand (or on a schedule): it needs the live site, and the charts are not
// committed, so it is not part of the test run.
import { readFile } from 'node:fs/promises'

import { LATITUDES, LONGITUDES, REGION_CODES } from './labels.mjs'
import { loadChart, measureChart, mercator, unwrap } from './lib.mjs'
import { chartFor, inputsFor, MAX_MISS_PX } from './measure.mjs'

const calibrations = JSON.parse(
  await readFile(
    new URL(
      '../../src/shared/helpers/chartGeometry/calibrations.json',
      import.meta.url,
    ),
    'utf8',
  ),
)

const directoryFlag = process.argv.indexOf('--dir')
const directory =
  directoryFlag > -1 ? process.argv[directoryFlag + 1] : undefined

let failed = false
for (const code of REGION_CODES) {
  try {
    const live = measureChart(
      await loadChart(await chartFor(code, directory)),
      inputsFor(code),
    )
    const committed = calibrations[code]
    // Where each labelled tick is, by the live chart and by the committed table.
    const misses = [
      ...LATITUDES[code].map((v) =>
        Math.abs(
          live.y0 +
            live.perMercator * mercator(v) -
            (committed.y0 + committed.perMercator * mercator(v)),
        ),
      ),
      ...unwrap(LONGITUDES[code]).map((v) =>
        Math.abs(
          live.x0 +
            live.perDegree * v -
            (committed.x0 + committed.perDegree * v),
        ),
      ),
    ]
    const worst = Math.max(...misses)
    const ok = worst <= MAX_MISS_PX
    if (!ok) failed = true
    console.log(
      `${code.padEnd(13)} ${ok ? 'ok     ' : 'MOVED  '} worst tick ${worst.toFixed(2)}px from the committed table`,
    )
  } catch (error) {
    failed = true
    console.log(`${code.padEnd(13)} FAILED: ${error.message}`)
  }
}
console.log(
  failed
    ? '\nThe charts no longer match the calibration.'
    : '\nAll regions match the calibration.',
)
process.exit(failed ? 1 : 0)
