import sharp from 'sharp'

import { rainImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export default function compressRainImage(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .webp({ quality: 40 })
    .extract({ ...rainImageDimensions, left: 73, top: 116 })
    .toBuffer()
}
