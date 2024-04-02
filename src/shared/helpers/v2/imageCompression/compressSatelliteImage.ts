import sharp from 'sharp'

import { satelliteImageDimensions } from '@/shared/helpers/v2/imageCompression/imageDimensions'

export function compressSatelliteImage(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .webp({ quality: 20, preset: 'photo' })
    .extract({ ...satelliteImageDimensions, left: 0, top: 0 })
    .toBuffer()
}
