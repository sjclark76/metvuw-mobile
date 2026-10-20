// A stand-in for metvuw.com for the e2e tests, so they do not depend on the live
// site being up, or on its markup staying the same. It serves the four listing
// pages the scrapers read, in the same shape, and the chart images they point
// at (real, correctly sized images, because the app crops and compresses them).
//
// Test conventions:
//   - region "estonia" always answers 502, to exercise the error state
//   - every other known region lists the same ten forecast charts
import http from 'node:http'

import sharp from 'sharp'

export const STUB_PORT = 4010

const RUN = '2026101518'
const FORECAST_HOURS = [
  '006',
  '012',
  '018',
  '024',
  '030',
  '036',
  '042',
  '048',
  '054',
  '060',
]
const RADAR_CODES = ['nl', 'ak', 'bp', 'mh', 'np', 'wn', 'ch', 'wl', 'nv']
// More radar and upper air charts than fit the first screen, where the app skips
// rendering the rest until they are near (see defer-offscreen in globals.css).
// Satellite's four already reach one, and tests rely on there being four.
const RADAR_TIMES = [
  '202610131500Z',
  '202610131510Z',
  '202610131520Z',
  '202610131530Z',
  '202610131540Z',
  '202610131550Z',
  '202610131600Z',
  '202610131610Z',
]
const SATELLITE_DATES = ['2026101512', '2026101515', '2026101518', '2026101521']
const BALLOONS = ['93112', '93417', '93844']
const BALLOON_TIMES = [
  '202610111100',
  '202610112300',
  '202610121100',
  '202610122300',
  '202610131100',
  '202610132300',
  '202610141100',
  '202610142300',
]
const FAILING_REGION = 'estonia'

const page = (images) =>
  `<!doctype html><html><body>${images
    .map((src) => `<img src="${src}">`)
    .join('\n')}</body></html>`

const pages = {
  '/forecast/forecast.php': (query) => {
    const region = query.get('region') ?? ''
    if (region === FAILING_REGION) return { status: 502, body: 'Bad Gateway' }
    return {
      body: page(
        FORECAST_HOURS.map(
          (h) => `./${RUN}/rain-${region}-thumb-${RUN}-${h}.gif`,
        ),
      ),
    }
  },
  '/radar/radar.php': () => ({
    body: page(
      RADAR_CODES.flatMap((code) =>
        RADAR_TIMES.map((time) => `./images/${time}_${code}.gif`),
      ),
    ),
  }),
  '/satellite': () => ({
    body: page(SATELLITE_DATES.map((d) => `./small/${d}.jpg`)),
  }),
  '/upperair': () => ({
    body: page(
      BALLOONS.flatMap((b) =>
        BALLOON_TIMES.map((t) => `./${t}.${b}.thumb.png`),
      ),
    ),
  }),
}

// Sized for the crops in src/shared/helpers/imageCompression: rain is cropped
// from (73, 116) to 565 x 396, radar is scaled to 565 wide then cropped to 540
// high, satellite is cropped to 840 x 607.
const images = {
  gif: (path) =>
    path.startsWith('/radar/')
      ? { width: 565, height: 560, format: 'gif' }
      : { width: 700, height: 560, format: 'gif' },
  jpg: () => ({ width: 900, height: 650, format: 'jpeg' }),
  png: () => ({ width: 760, height: 690, format: 'png' }),
}

// Rain charts are the chart's pale background with, over Wanaka (on the NZ chart:
// 47.79% across and 68.71% down the cropped chart), a block in the colour of one
// of metvuw's rain bands. Which band depends on the forecast hour, so a test can
// tell the charts apart:
//   006 and the hours not listed: no rain   012: 1 mm (magenta)
//   018: 5 mm (blue)                         024: 20+ mm (red-orange)
const RAIN_AT_WANAKA = { '012': '#ff00ff', '018': '#0000ff', '024': '#ff3f00' }
const RAIN_BACKGROUND = '#e6e6ff'
async function rainChart(hour) {
  const width = 700
  const height = 560
  const input = RAIN_AT_WANAKA[hour]
    ? [
        {
          input: await sharp({
            create: {
              width: 31,
              height: 31,
              channels: 3,
              background: RAIN_AT_WANAKA[hour],
            },
          })
            .png()
            .toBuffer(),
          // The crop starts at (73, 116) and is 565 x 396.
          left: Math.round(73 + 0.4779 * 564) - 15,
          top: Math.round(116 + 0.6871 * 395) - 15,
        },
      ]
    : []
  const buffer = await sharp({
    create: { width, height, channels: 3, background: RAIN_BACKGROUND },
  })
    .composite(input)
    .gif({ dither: 0 })
    .toBuffer()
  return { buffer, type: 'image/gif' }
}

const imageCache = new Map()
async function image(path) {
  const rain = path.match(/\/rain-\w+-(?:thumb-)?\d+-(\d{3})\.gif$/)
  if (rain) {
    const key = `rain-${rain[1]}`
    if (!imageCache.has(key)) imageCache.set(key, await rainChart(rain[1]))
    return imageCache.get(key)
  }
  const extension = path.split('.').pop()
  const make = images[extension]
  if (!make) return undefined
  const { width, height, format } = make(path)
  const key = `${format}-${width}x${height}`
  if (!imageCache.has(key)) {
    const buffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 70, g: 130, b: 180 },
      },
    })
      [format]()
      .toBuffer()
    imageCache.set(key, {
      buffer,
      type: `image/${format === 'jpeg' ? 'jpeg' : format}`,
    })
  }
  return imageCache.get(key)
}

export function createStubServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://stub')

    if (url.pathname === '/health') {
      response.writeHead(200).end('ok')
      return
    }

    const handler = pages[url.pathname]
    if (handler) {
      const { status = 200, body } = handler(url.searchParams)
      response
        .writeHead(status, { 'content-type': 'text/html; charset=utf-8' })
        .end(body)
      return
    }

    const found = await image(url.pathname)
    if (found) {
      response.writeHead(200, { 'content-type': found.type }).end(found.buffer)
      return
    }

    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
  })
}

// Run directly (`node e2e/stub/metvuw-stub.mjs`) to start it.
if (import.meta.url === `file://${process.argv[1]}`) {
  createStubServer().listen(STUB_PORT, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`metvuw stub listening on http://127.0.0.1:${STUB_PORT}`)
  })
}
