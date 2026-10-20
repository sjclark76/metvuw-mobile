// Measuring a metvuw region chart: where its axis labels and tick marks are, and
// the map (longitude linear in x, latitude Mercator in y) that fits them.
import sharp from 'sharp'

/** Every chart is 711x600; the plot area is x 71..639, with its bottom edge at y 529. */
export const CHART = { width: 711, height: 600 }

export async function loadChart(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  }
}

const gray = (image, x, y) => {
  const i = (y * image.width + x) * image.channels
  return (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3
}

export function mercator(latitude) {
  const clamped = Math.max(-89.9, Math.min(89.9, latitude))
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))
}

/** Longitudes written as they appear along an axis, made to keep increasing across 180. */
export function unwrap(longitudes) {
  const out = []
  for (const value of longitudes) {
    let v = value
    while (out.length && v < out[out.length - 1] - 180) v += 360
    out.push(v)
  }
  return out
}

/** Straight line through (x, y) points: y = a + b x, and the worst miss in y. */
export function fitLine(xs, ys) {
  const n = xs.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  const b = num / den
  const a = my - b * mx
  const worst = Math.max(...xs.map((x, i) => Math.abs(a + b * x - ys[i])))
  return { a, b, worst }
}

/** Runs of true values (allowing gaps up to `gap`), as [first, last] index pairs. */
function runs(flags, gap) {
  const out = []
  let start = null
  let last = null
  flags.forEach((flag, i) => {
    if (flag) {
      if (start === null) start = i
      last = i
    } else if (start !== null && i - last > gap) {
      out.push([start, last])
      start = null
    }
  })
  if (start !== null) out.push([start, last])
  return out
}

/** Where the axis labels are: vertical centres down the left edge, horizontal along the bottom. */
export function labelCentres(image, expectedLatitudes) {
  const top = 100
  const down = []
  for (let y = top; y <= 540; y++) {
    let dark = false
    for (let x = 4; x < 64 && !dark; x++) dark = gray(image, x, y) < 120
    down.push(dark)
  }
  let latitude = runs(down, 3)
    .filter(([a, b]) => b - a >= 6)
    .map(([a, b]) => top + (a + b) / 2)
  // The first longitude label sits in the top-left corner and can be picked up too.
  if (latitude.length === expectedLatitudes + 1) latitude = latitude.slice(1)

  const across = []
  for (let x = 40; x < 711; x++) {
    let dark = false
    for (let y = 538; y < 558 && !dark; y++) dark = gray(image, x, y) < 120
    across.push(dark)
  }
  const longitude = runs(across, 9)
    .filter(([a, b]) => b - a >= 10)
    .map(([a, b]) => 40 + (a + b) / 2)
  return { latitude, longitude }
}

/** The darkest single mark within +/-halfWidth of `centre`, as its weighted centre. */
function strongestMark(profile, centre, halfWidth, low, high) {
  const from = Math.max(low, Math.round(centre) - halfWidth)
  const to = Math.min(high, Math.round(centre) + halfWidth)
  const marks = []
  let current = []
  for (let i = from; i <= to; i++) {
    const v = profile(i)
    if (v > 150) current.push([i, v])
    else if (current.length) {
      marks.push(current)
      current = []
    }
  }
  if (current.length) marks.push(current)
  if (!marks.length) return undefined
  const weight = (mark) => mark.reduce((s, [, v]) => s + v, 0)
  const best = marks.reduce((a, b) => (weight(b) > weight(a) ? b : a))
  return best.reduce((s, [i, v]) => s + i * v, 0) / weight(best)
}

/**
 * Finds the tick marks for labelled values, near where `predict` says they are,
 * and fits the map to them. `predict` maps a map's {latitude: {a, b}, longitude:
 * {a, b}} to pixel positions. Returns the fitted map and the tick positions.
 */
export function measureTicks(image, latitudes, longitudes, start) {
  const down = (y) =>
    255 -
    gray(image, 68, y) +
    (255 - gray(image, 69, y)) +
    (255 - gray(image, 70, y))
  const across = (x) =>
    255 -
    gray(image, x, 531) +
    (255 - gray(image, x, 532)) +
    (255 - gray(image, x, 533))
  const lons = unwrap(longitudes)
  let { ay, by, ax, bx } = start

  const find = (halfWidth) => {
    const lat = latitudes.map((v) => ({
      value: v,
      at: strongestMark(down, ay + by * mercator(v), halfWidth, 90, 540),
    }))
    const lon = lons.map((v) => ({
      value: v,
      at: strongestMark(across, ax + bx * v, halfWidth, 60, 650),
    }))
    return {
      lat: lat.filter((p) => p.at !== undefined),
      lon: lon.filter((p) => p.at !== undefined),
    }
  }
  const fit = (points, toX) =>
    fitLine(
      points.map((p) => toX(p.value)),
      points.map((p) => p.at),
    )

  let found
  for (const halfWidth of [4, 2]) {
    found = find(halfWidth)
    ;({ a: ay, b: by } = fit(found.lat, mercator))
    ;({ a: ax, b: bx } = fit(found.lon, (v) => v))
  }

  // If one tick sits more than 0.8px off a fit of the others, refit without it and
  // look again for it where the others say it should be.
  const settle = (points, toX, profile, low, high) => {
    let pts = points.slice()
    for (let pass = 0; pass < 2 && pts.length >= 4; pass++) {
      const { a, b } = fitLine(
        pts.map((p) => toX(p.value)),
        pts.map((p) => p.at),
      )
      const misses = pts.map((p) => Math.abs(a + b * toX(p.value) - p.at))
      const worst = misses.indexOf(Math.max(...misses))
      if (misses[worst] <= 0.8) break
      const rest = pts.filter((_, i) => i !== worst)
      const refit = fitLine(
        rest.map((p) => toX(p.value)),
        rest.map((p) => p.at),
      )
      const again = strongestMark(
        profile,
        refit.a + refit.b * toX(pts[worst].value),
        2,
        low,
        high,
      )
      pts = pts
        .map((p, i) => (i === worst ? { value: p.value, at: again } : p))
        .filter((p) => p.at !== undefined)
    }
    return pts
  }
  const lat = settle(found.lat, mercator, down, 90, 540)
  const lon = settle(found.lon, (v) => v, across, 60, 650)
  const latFit = fit(lat, mercator)
  const lonFit = fit(lon, (v) => v)
  return {
    y0: latFit.a,
    perMercator: latFit.b,
    x0: lonFit.a,
    perDegree: lonFit.b,
    latitudeMiss: latFit.worst,
    longitudeMiss: lonFit.worst,
    latitudeTicks: lat.map((p) => [p.value, p.at]),
    longitudeTicks: lon.map((p) => [p.value, p.at]),
    found: { latitude: lat.length, longitude: lon.length },
  }
}

/** Measures one chart from scratch: label centres first, then the tick marks. */
export function measureChart(image, { latitudes, longitudes, longitudeSeed }) {
  if (image.width !== CHART.width || image.height !== CHART.height) {
    throw new Error(
      `chart is ${image.width}x${image.height}, expected ${CHART.width}x${CHART.height}`,
    )
  }
  const centres = labelCentres(image, latitudes.length)
  const lons = unwrap(longitudes)
  const lonCentres = longitudeSeed ?? centres.longitude
  if (centres.latitude.length !== latitudes.length) {
    throw new Error(
      `found ${centres.latitude.length} latitude labels, expected ${latitudes.length}`,
    )
  }
  if (lonCentres.length !== lons.length) {
    throw new Error(
      `found ${lonCentres.length} longitude labels, expected ${lons.length}`,
    )
  }
  const lat = fitLine(latitudes.map(mercator), centres.latitude)
  const lon = fitLine(lons, lonCentres)
  return measureTicks(image, latitudes, longitudes, {
    ay: lat.a,
    by: lat.b,
    ax: lon.a,
    bx: lon.b,
  })
}
