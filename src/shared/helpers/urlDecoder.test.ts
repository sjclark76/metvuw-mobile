import {
  decodeRadarUrl,
  decodeRainUrl,
  decodeSatelliteUrl,
  decodeUpperAirUrl,
} from './urlDecoder'

const attributes = { height: 100, width: 100 }
describe('urlDecoder  tests', () => {
  describe('decodeRainUrl', () => {
    it('should return the correct object', () => {
      const relativeUrl = './2024032518/rain-nz-thumb-2024032518-006.gif'

      expect(decodeRainUrl(relativeUrl, attributes)).toMatchInlineSnapshot(`
{
  "day": 25,
  "forecastDate": "2024-03-26T00:00:00.000Z",
  "height": 100,
  "hour": 18,
  "imageDateISO": "2024-03-25T18:00:00.000Z",
  "imageDateUTC": 1711389600000,
  "month": 2,
  "name": "rain-nz-thumb-2024032518-006.gif",
  "offset": 6,
  "path": "rain/nz/rain-nz-thumb-2024032518-006.gif",
  "url": "https://metvuw.com/forecast/2024032518/rain-nz-thumb-2024032518-006.gif",
  "width": 100,
  "year": 2024,
}
`)
    })

    it('should return the correct object for the north island', () => {
      const relativeUrl = './2023082818/rain-nzni-thumb-2023082818-240.gif'

      expect(decodeRainUrl(relativeUrl, attributes)).toMatchInlineSnapshot(`
{
  "day": 28,
  "forecastDate": "2023-09-07T18:00:00.000Z",
  "height": 100,
  "hour": 18,
  "imageDateISO": "2023-08-28T18:00:00.000Z",
  "imageDateUTC": 1693245600000,
  "month": 7,
  "name": "rain-nzni-thumb-2023082818-240.gif",
  "offset": 240,
  "path": "rain/nzni/rain-nzni-thumb-2023082818-240.gif",
  "url": "https://metvuw.com/forecast/2023082818/rain-nzni-thumb-2023082818-240.gif",
  "width": 100,
  "year": 2023,
}
`)
    })
  })

  // ./2023082818/rain-nzni-thumb-2023082818-240.gif

  describe('decodeSatelliteUrl', () => {
    it('should return the correct object', () => {
      const url = './small/202308270300.jpg'

      expect(decodeSatelliteUrl(url, attributes)).toMatchInlineSnapshot(`
{
  "day": 27,
  "height": 100,
  "hour": 3,
  "imageDateISO": "2023-08-27T03:00:00.000Z",
  "imageDateUTC": 1693105200000,
  "month": 7,
  "name": "202308270300.jpg",
  "path": "satellite/202308270300.jpg",
  "url": "https://metvuw.com/satellite/big/202308270300.jpg",
  "width": 100,
  "year": 2023,
}
`)
    })
  })

  describe('decodeRadarUrl', () => {
    it('should return the correct object', () => {
      const url = './images/202308271500Z_nl.gif'

      expect(decodeRadarUrl(url, attributes)).toMatchInlineSnapshot(`
{
  "day": 27,
  "height": 100,
  "hour": 15,
  "imageDateISO": "2023-08-27T15:00:00.000Z",
  "imageDateUTC": 1693148400000,
  "month": 7,
  "name": "202308271500Z_nl.gif",
  "path": "radar/nl/202308271500Z_nl.gif",
  "radar": "Northland",
  "radarCode": "nl",
  "url": "https://metvuw.com/radar/images/202308271500Z_nl.gif",
  "width": 100,
  "year": 2023,
}
`)
    })
  })

  describe('decodeUpperAirUrl', () => {
    it('should return the correct object', () => {
      const url = './202308301200.93112.thumb.png'

      expect(decodeUpperAirUrl(url, attributes)).toMatchInlineSnapshot(`
{
  "balloonLocation": "Whenuapai",
  "balloonLocationCode": "93112",
  "day": 30,
  "height": 100,
  "hour": 12,
  "imageDateISO": "2023-08-30T12:00:00.000Z",
  "imageDateUTC": 1693396800000,
  "month": 7,
  "name": "202308301200.93112.png",
  "path": "upper-air/93112/202308301200.93112.png",
  "url": "https://metvuw.com/upperair/202308301200.93112.png",
  "width": 100,
  "year": 2023,
}
`)
    })
  })
})
