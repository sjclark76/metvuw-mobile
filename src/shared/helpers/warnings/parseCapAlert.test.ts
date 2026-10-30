import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { parseCapAlert } from './parseCapAlert'

const fixture = (name: string) =>
  readFileSync(join(__dirname, 'fixtures', name), 'utf8')
const wind = fixture('wind-hawkes-bay.xml')
const snow = fixture('road-snow-lewis-pass.xml')
// Before both alerts end (21:00 and 22:00 on 30 Oct 2026, New Zealand time).
const NOW = new Date('2026-10-30T00:00:00Z')

describe('parseCapAlert', () => {
  describe("a wind watch (Hawke's Bay, 30 Oct 2026)", () => {
    const alerts = parseCapAlert(wind, NOW)

    test('is one alert, with what the note shows', () => {
      expect(alerts).toHaveLength(1)
      expect(alerts[0]).toMatchObject({
        id: '2.49.0.0.554.0.severeweather.nz.20261029205033134.1',
        headline: 'Strong Wind Watch',
        event: 'wind',
        severity: 'Minor',
        colour: 'Yellow',
        colourHex: '#FFEB18',
        onsetUTC: 1793314800000,
        expiresUTC: 1793347200000,
        web: 'https://metservice.com/warnings/home',
      })
    })

    test('has its area, with the polygon rounded to 2 places and no repeated points', () => {
      expect(alerts[0].areas).toHaveLength(1)
      expect(alerts[0].areas[0].description).toBe(
        "Hawke's Bay south of Hastings and the Tararua District",
      )
      const [polygon] = alerts[0].areas[0].polygons
      expect(polygon).toHaveLength(187)
      expect(polygon[0]).toEqual([-40, 176.09])
    })
  })

  test('reads a road snow alert, which is orange', () => {
    const [alert] = parseCapAlert(snow, NOW)

    expect(alert).toMatchObject({
      headline: 'Road Snowfall Warning',
      event: 'snow',
      severity: 'Moderate',
      colour: 'Orange',
      colourHex: '#FF8918',
      onsetUTC: 1793332800000,
      expiresUTC: 1793350800000,
    })
    expect(alert.areas[0].polygons[0]).toHaveLength(162)
    expect(alert.areas[0].polygons[0][0]).toEqual([-42.34, 172.18])
  })

  describe('what is dropped', () => {
    test('a cancelled alert', () => {
      const cancelled = wind.replace(
        '<msgType>Update</msgType>',
        '<msgType>Cancel</msgType>',
      )

      expect(parseCapAlert(cancelled, NOW)).toEqual([])
    })

    test('a test alert', () => {
      const testAlert = wind.replace(
        '<status>Actual</status>',
        '<status>Test</status>',
      )

      expect(parseCapAlert(testAlert, NOW)).toEqual([])
    })

    test('an alert that is not public', () => {
      const hidden = wind.replace(
        '<scope>Public</scope>',
        '<scope>Private</scope>',
      )

      expect(parseCapAlert(hidden, NOW)).toEqual([])
    })

    test('an alert that has ended', () => {
      expect(parseCapAlert(wind, new Date('2026-10-30T09:00:00Z'))).toEqual([])
    })

    test('an alert with no polygon', () => {
      const noArea = wind.replace(/<polygon>[^<]*<\/polygon>/, '')

      expect(parseCapAlert(noArea, NOW)).toEqual([])
    })

    test('something that is not an alert', () => {
      expect(parseCapAlert('not xml', NOW)).toEqual([])
      expect(parseCapAlert('', NOW)).toEqual([])
    })
  })

  describe('what is made safe', () => {
    test('an alert with no colour code has no colour', () => {
      const plain = wind.replace(
        /<parameter><valueName>ColourCode(Hex)?<\/valueName><value>[^<]*<\/value><\/parameter>/g,
        '',
      )
      const [alert] = parseCapAlert(plain, NOW)

      expect(alert.colour).toBeUndefined()
      expect(alert.colourHex).toBeUndefined()
    })

    test('a colour that is not #rrggbb is dropped, not used in a style', () => {
      const odd = wind.replace('#FFEB18', 'red;background:url(x)')
      const [alert] = parseCapAlert(odd, NOW)

      expect(alert.colour).toBe('Yellow')
      expect(alert.colourHex).toBeUndefined()
    })

    test('a link to anywhere but MetService is replaced', () => {
      const foreign = wind.replace(
        '<web>https://metservice.com/warnings/home</web>',
        '<web>https://evil.example/x</web>',
      )
      const [alert] = parseCapAlert(foreign, NOW)

      expect(alert.web).toBe('https://www.metservice.com/warnings/home')
    })

    test('an alert with no start time starts when it was sent', () => {
      const noOnset = wind.replace(/<onset>[^<]*<\/onset>/, '')
      const [alert] = parseCapAlert(noOnset, NOW)

      expect(alert.onsetUTC).toBe(Date.parse('2026-10-30T09:50:33+13:00'))
    })
  })

  test('each info block is an alert of its own', () => {
    const info = /<info>.*<\/info>/s.exec(wind)?.[0] ?? ''
    const two = wind.replace('</alert>', `${info}</alert>`)

    const alerts = parseCapAlert(two, NOW)

    expect(alerts.map((alert) => alert.id)).toEqual([
      '2.49.0.0.554.0.severeweather.nz.20261029205033134.1',
      '2.49.0.0.554.0.severeweather.nz.20261029205033134.1#1',
    ])
  })
})
