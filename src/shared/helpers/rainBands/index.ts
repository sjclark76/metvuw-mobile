export interface RainBand {
  /** The band's label on metvuw's key: its lightest rain, in mm. The last is "20+". */
  label: string
  /** Rain this heavy or heavier, up to the next band, in mm over 6 hours. */
  fromMm: number
  hexCode: string
}

/**
 * The colours of metvuw's rain charts, from its own key
 * (https://metvuw.com/pageheaders/scale.gif): accumulated rain over 6 hours, in 20
 * steps of 1 mm from 1 to 20+. Where there is less than 1 mm, the chart is not
 * coloured.
 */
export const RAIN_BANDS: ReadonlyArray<RainBand> = [
  { label: '1', fromMm: 1, hexCode: '#FF00FF' },
  { label: '2', fromMm: 2, hexCode: '#BF00FF' },
  { label: '3', fromMm: 3, hexCode: '#7F00FF' },
  { label: '4', fromMm: 4, hexCode: '#3F00FF' },
  { label: '5', fromMm: 5, hexCode: '#0000FF' },
  { label: '6', fromMm: 6, hexCode: '#003FFF' },
  { label: '7', fromMm: 7, hexCode: '#007FFF' },
  { label: '8', fromMm: 8, hexCode: '#00BFFF' },
  { label: '9', fromMm: 9, hexCode: '#00FFFF' },
  { label: '10', fromMm: 10, hexCode: '#00FFBF' },
  { label: '11', fromMm: 11, hexCode: '#00FF7F' },
  { label: '12', fromMm: 12, hexCode: '#00FF3F' },
  { label: '13', fromMm: 13, hexCode: '#00FF00' },
  { label: '14', fromMm: 14, hexCode: '#3FFF00' },
  { label: '15', fromMm: 15, hexCode: '#7FFF00' },
  { label: '16', fromMm: 16, hexCode: '#BFFF00' },
  { label: '17', fromMm: 17, hexCode: '#FFFF00' },
  { label: '18', fromMm: 18, hexCode: '#FFBF00' },
  { label: '19', fromMm: 19, hexCode: '#FF7F00' },
  { label: '20+', fromMm: 20, hexCode: '#FF3F00' },
]

const bandByColour = new Map(
  RAIN_BANDS.map((band, index) => [band.hexCode.toLowerCase(), index]),
)

const hex = (value: number) => value.toString(16).padStart(2, '0')

/**
 * The band whose colour is exactly this one, as an index into RAIN_BANDS, or
 * undefined for any other colour: no rain, or the chart's own lines, land and
 * text. Exact on purpose: the charts are served lossless, and a near match would
 * read an isobar or a coast as rain.
 */
export function bandAt(red: number, green: number, blue: number) {
  return bandByColour.get(`#${hex(red)}${hex(green)}${hex(blue)}`)
}

// Rain must cover at least this share of a patch to count: enough that a shower
// only grazing the edge of the patch, or a stray pixel of a band's colour, does not.
const MIN_RAIN_SHARE = 0.12

/**
 * The band of rain in a patch of chart pixels (RGBA bytes, four to a pixel), as an
 * index into RAIN_BANDS, or undefined if too little of the patch is rain. The band
 * is the one covering most of the patch (the heavier of two that tie).
 *
 * A patch, not a single pixel: the chart draws its isobars, their labels and the
 * wind barbs over the rain, so the pixels right at a place can be a label's white
 * and black with rain all round it.
 */
export function bandInPatch(pixels: ArrayLike<number>) {
  const counts = new Array<number>(RAIN_BANDS.length).fill(0)
  let size = 0
  let rain = 0
  for (let at = 0; at + 3 < pixels.length; at += 4) {
    size++
    if (pixels[at + 3] !== 255) continue
    const band = bandAt(pixels[at], pixels[at + 1], pixels[at + 2])
    if (band === undefined) continue
    counts[band]++
    rain++
  }
  if (size === 0 || rain / size < MIN_RAIN_SHARE) return undefined
  let best = 0
  for (let band = 1; band < counts.length; band++) {
    if (counts[band] >= counts[best]) best = band
  }
  return best
}
