import sharp from 'sharp'

import {
  satelliteImageDimensions,
  smallSatelliteImageDimensions,
} from '@/shared/helpers/v2/imageCompression/imageDimensions'

export function compressSatelliteImage(image: Buffer) {
  return sharp(image)
    .webp({ quality: 20, preset: 'photo' })
    .extract({ ...satelliteImageDimensions, left: 0, top: 0 })
    .toBuffer()
}

export function compressSmallSatelliteImage(image: Buffer) {
  return sharp(image)
    .webp({ quality: 20, preset: 'photo' })
    .extract({ ...satelliteImageDimensions, left: 0, top: 0 })
    .resize({ ...smallSatelliteImageDimensions })
    .toBuffer()
}
