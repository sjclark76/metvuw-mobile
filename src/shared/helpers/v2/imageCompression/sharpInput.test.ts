import sharp from 'sharp'

import { compressRadarImage } from './compressRadarImage'
import compressRainImage from './compressRainImage'
import { compressSatelliteImage } from './compressSatelliteImage'
import { compressUpperAirImage } from './compressUpperAirImage'
import { MAX_INPUT_PIXELS } from './sharpInput'

// A small, highly compressible file can decode to a huge bitmap. Every
// compressor must refuse images over the pixel cap instead of decoding them.
describe('sharp input limits', () => {
  let oversized: Buffer

  beforeAll(async () => {
    const side = Math.ceil(Math.sqrt(MAX_INPUT_PIXELS)) + 1
    oversized = await sharp({
      create: {
        width: side,
        height: side,
        channels: 3,
        background: '#000000',
      },
    })
      .png()
      .toBuffer()
  })

  test.each([
    ['radar', compressRadarImage],
    ['rain', compressRainImage],
    ['satellite', compressSatelliteImage],
    ['upper air', compressUpperAirImage],
  ])(
    'the %s compressor rejects an oversized image',
    async (_name, compress) => {
      await expect(compress(oversized)).rejects.toThrow(/pixel limit/i)
    },
  )
})
