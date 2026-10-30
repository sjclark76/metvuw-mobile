import * as cheerio from 'cheerio'

export type AlertColour = 'Red' | 'Orange' | 'Yellow'
export type AlertSeverity =
  'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'

/** The corners of an area, as [latitude, longitude]. */
export type Polygon = [number, number][]

export interface AlertArea {
  description: string
  polygons: Polygon[]
}

/** What the note needs of one MetService watch, warning or advisory. */
export interface WeatherAlert {
  id: string
  /** As MetService titles it: "Strong Wind Watch". */
  headline: string
  /** CAP's kind of weather: "wind", "snow"... */
  event: string
  severity: AlertSeverity
  colour?: AlertColour
  /** MetService's colour for it, as #rrggbb. */
  colourHex?: string
  /** When it starts and ends (epoch ms). */
  onsetUTC: number
  expiresUTC: number
  /** Where to read it in full: always on metservice.com. */
  web: string
  areas: AlertArea[]
}

const COLOURS: readonly AlertColour[] = ['Red', 'Orange', 'Yellow']
const SEVERITIES = ['Extreme', 'Severe', 'Moderate', 'Minor'] as const
const FALLBACK_WEB = 'https://www.metservice.com/warnings/home'

/** Only MetService's own site: the address comes from outside. */
function isMetServiceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'metservice.com' ||
        url.hostname.endsWith('.metservice.com'))
    )
  } catch {
    return false
  }
}

// About 1 km: enough to say which side of a coast or ridge a place is, and small
// enough to send to every visitor.
const round2 = (value: number) => Math.round(value * 100) / 100

/** "lat,lon lat,lon ...", rounded, with repeated points removed. */
function parsePolygon(text: string): Polygon {
  const points: Polygon = []
  for (const pair of text.trim().split(/\s+/)) {
    const [latitude, longitude] = pair.split(',').map(Number)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    const point: [number, number] = [round2(latitude), round2(longitude)]
    const last = points.at(-1)
    if (!last || last[0] !== point[0] || last[1] !== point[1]) {
      points.push(point)
    }
  }
  return points
}

/**
 * The alerts in one CAP 1.2 document (MetService's public feed), or none for one
 * that is cancelled, a test, not public, over, or has no area to place it. Each
 * `info` block is an alert of its own.
 */
export function parseCapAlert(xml: string, now: Date): WeatherAlert[] {
  const $ = cheerio.load(xml, { xml: true })
  const alert = $('alert').first()
  if (alert.children('status').text() !== 'Actual') return []
  if (alert.children('msgType').text() === 'Cancel') return []
  if (alert.children('scope').text() !== 'Public') return []
  const identifier = alert.children('identifier').text()
  if (!identifier) return []
  const sent = Date.parse(alert.children('sent').text())

  return alert
    .children('info')
    .toArray()
    .flatMap((element, index): WeatherAlert[] => {
      const info = $(element)
      const expiresUTC = Date.parse(info.children('expires').text())
      if (!Number.isFinite(expiresUTC) || expiresUTC <= now.getTime()) return []
      const onset = Date.parse(info.children('onset').text())
      const onsetUTC = Number.isFinite(onset) ? onset : sent
      if (!Number.isFinite(onsetUTC)) return []

      const areas = info
        .children('area')
        .toArray()
        .flatMap((area) => {
          const polygons = $(area)
            .children('polygon')
            .toArray()
            .map((polygon) => parsePolygon($(polygon).text()))
            .filter((polygon) => polygon.length >= 3)
          return polygons.length > 0
            ? [{ description: $(area).children('areaDesc').text(), polygons }]
            : []
        })
      if (areas.length === 0) return []

      const parameters = new Map(
        info
          .children('parameter')
          .toArray()
          .map((parameter) => [
            $(parameter).children('valueName').text(),
            $(parameter).children('value').text(),
          ]),
      )
      const hex = parameters.get('ColourCodeHex')
      const severity = info.children('severity').text()
      const web = info.children('web').text()

      return [
        {
          id: index === 0 ? identifier : `${identifier}#${index}`,
          headline: info.children('headline').text(),
          event: info.children('event').text(),
          severity: SEVERITIES.find((s) => s === severity) ?? 'Unknown',
          colour: COLOURS.find((c) => c === parameters.get('ColourCode')),
          colourHex: hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : undefined,
          onsetUTC,
          expiresUTC,
          web: isMetServiceUrl(web) ? web : FALLBACK_WEB,
          areas,
        },
      ]
    })
}
