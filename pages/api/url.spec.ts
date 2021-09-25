import { decodeSatelliteUrl } from './url'
import { expect } from '@jest/globals'

describe('', () => {
  test('retrieving sattelite images should be successful', async () => {
    const result = await decodeSatelliteUrl('./small/202109240000.jpg')

    expect(result).toMatchInlineSnapshot(`
Object {
  "day": 24,
  "hour": 0,
  "imageDate": 1632441600000,
  "imageDateIso": "2021-09-24T00:00:00.000Z",
  "month": 8,
  "year": 2021,
}
`)
  })
})

describe('', () => {
  test('retrieving sattelite images should be successful', async () => {
    const result = await decodeSatelliteUrl(' ./small/202109250000.jpg')

    expect(result).toMatchInlineSnapshot(`
Object {
  "day": 25,
  "hour": 0,
  "imageDate": 1632528000000,
  "imageDateIso": "2021-09-25T00:00:00.000Z",
  "month": 8,
  "year": 2021,
}
`)
  })
})
