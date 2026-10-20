/* eslint-disable no-console -- a command-line tool: printing is its output */
// Builds the place list the app searches from the GeoNames downloads:
//
//   node scripts/places/build.mjs --dir <folder>
//
// The folder holds the unzipped GeoNames files (free, CC BY 4.0), from
// https://download.geonames.org/export/dump/ :
//   NZ.txt  cities15000.txt  admin1CodesASCII.txt  countryInfo.txt
// Writes public/places/places.v1.json. The result is committed, so a build never
// depends on GeoNames being reachable; run this only to refresh the list.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { buildPlaceData, serialise } from './build-lib.mjs'

const OUTPUT = 'public/places/places.v1.json'

const flag = process.argv.indexOf('--dir')
if (flag === -1 || !process.argv[flag + 1]) {
  console.error(
    'usage: node scripts/places/build.mjs --dir <folder of GeoNames files>',
  )
  process.exit(1)
}
const directory = process.argv[flag + 1]
const read = (name) => readFile(path.join(directory, name), 'utf8')

const data = buildPlaceData({
  nzText: await read('NZ.txt'),
  worldText: await read('cities15000.txt'),
  adminText: await read('admin1CodesASCII.txt'),
  countryText: await read('countryInfo.txt'),
  generated: new Date().toISOString().slice(0, 10),
})
await mkdir(path.dirname(OUTPUT), { recursive: true })
const text = serialise(data)
await writeFile(OUTPUT, text)
console.log(
  `${data.places.length} places, ${data.kinds.length} kinds, ${data.contexts.length} contexts, ${(text.length / 1e6).toFixed(2)}MB -> ${OUTPUT}`,
)
