import {
  decodeRadarUrl,
  decodeRainUrl,
  decodeSatelliteUrl,
  decodeUpperAirUrl,
} from './urlHelper'

describe('urlHelper tests', () => {
  describe('decodeRainUrl', () => {
    it('should return the correct object', () => {
      const relativeUrl = './2021060500/rain-nz-thumb-2021060500-006.gif'

      expect(decodeRainUrl(relativeUrl)).toMatchInlineSnapshot(`
{
  "day": 5,
  "forecastDate": "2021-06-05T06:00:00.000Z",
  "hour": 0,
  "imageDateISO": "2021-06-05T00:00:00.000Z",
  "imageDateUTC": 1622851200000,
  "month": 5,
  "offset": 6,
  "year": 2021,
}
`)
    })

    it('should return the correct object for the north island', () => {
      const relativeUrl = './2023082818/rain-nzni-thumb-2023082818-240.gif'

      expect(decodeRainUrl(relativeUrl)).toMatchInlineSnapshot(`
{
  "day": 28,
  "forecastDate": "2023-09-07T18:00:00.000Z",
  "hour": 18,
  "imageDateISO": "2023-08-28T18:00:00.000Z",
  "imageDateUTC": 1693245600000,
  "month": 7,
  "offset": 240,
  "year": 2023,
}
`)
    })
  })

  // ./2023082818/rain-nzni-thumb-2023082818-240.gif

  describe('decodeSatelliteUrl', () => {
    it('should return the correct object', () => {
      const url = './small/202308270300.jpg'

      expect(decodeSatelliteUrl(url)).toMatchInlineSnapshot(`
{
  "day": 27,
  "hour": 3,
  "imageDateISO": "2023-08-27T03:00:00.000Z",
  "imageDateUTC": 1693105200000,
  "month": 7,
  "year": 2023,
}
`)
    })
  })

  describe('decodeRadarUrl', () => {
    it('should return the correct object', () => {
      const url = './images/202308271500Z_nl.gif'

      expect(decodeRadarUrl(url)).toMatchInlineSnapshot(`
{
  "day": 27,
  "hour": 15,
  "imageDateISO": "2023-08-27T15:00:00.000Z",
  "imageDateUTC": 1693148400000,
  "month": 7,
  "radar": "Northland",
  "radarCode": "nl",
  "year": 2023,
}
`)
    })
  })

  describe('decodeRadarUrl', () => {
    it('should return the correct object', () => {
      const url = './202308301200.93112.thumb.png'

      expect(decodeUpperAirUrl(url)).toMatchInlineSnapshot(`
{
  "balloonLocation": "Whenuapai",
  "balloonLocationCode": "93112",
  "day": 30,
  "hour": 12,
  "imageDateISO": "2023-08-30T12:00:00.000Z",
  "imageDateUTC": 1693396800000,
  "month": 7,
  "year": 2023,
}
`)
    })
  })
})
