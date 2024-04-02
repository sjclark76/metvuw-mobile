import sharp from 'sharp'

import { radarImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export function compressRadarImage(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .webp({ quality: 100 })
    .sharpen()
    .resize({ width: 565 })
    .extract({ ...radarImageDimensions, left: 0, top: 0 })
    .toBuffer()
}
