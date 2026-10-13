import sharp from 'sharp'

import { smallUpperAirImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'
import { sharpInputOptions } from '@/shared/helpers/v2/imageCompression/sharpInput'

export function compressUpperAirImage(image: Buffer): Promise<Buffer> {
  return sharp(image, sharpInputOptions)
    .webp({ quality: 30, preset: 'picture' })
    .toBuffer()
}

export function compressSmallUpperAirImage(image: Buffer): Promise<Buffer> {
  return sharp(image, sharpInputOptions)
    .webp({ quality: 30, preset: 'picture' })
    .resize({ ...smallUpperAirImageDimensions })
    .toBuffer()
}
