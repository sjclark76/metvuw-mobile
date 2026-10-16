import sharp from 'sharp'

import { radarImageDimensions } from '@/shared/helpers/imageCompression/imageDimensions'
import { sharpInputOptions } from '@/shared/helpers/imageCompression/sharpInput'

export function compressRadarImage(image: Buffer): Promise<Buffer> {
  return sharp(image, sharpInputOptions)
    .webp({ quality: 100 })
    .sharpen()
    .resize({ width: 565 })
    .extract({ ...radarImageDimensions, left: 0, top: 0 })
    .toBuffer()
}
