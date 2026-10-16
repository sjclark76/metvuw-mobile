import sharp from 'sharp'

import { rainImageDimensions } from '@/shared/helpers/imageCompression/imageDimensions'
import { sharpInputOptions } from '@/shared/helpers/imageCompression/sharpInput'

export default function compressRainImage(image: Buffer): Promise<Buffer> {
  return sharp(image, sharpInputOptions)
    .webp({ quality: 40 })
    .extract({ ...rainImageDimensions, left: 73, top: 116 })
    .toBuffer()
}
