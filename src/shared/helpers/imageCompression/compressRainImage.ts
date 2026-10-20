import sharp from 'sharp'

import { rainCrop } from '@/shared/helpers/imageCompression/imageDimensions'
import { sharpInputOptions } from '@/shared/helpers/imageCompression/sharpInput'

// Lossless, not lossy: the rain strip for a pin reads the band of rain from the
// chart's pixels, and a lossy encoding smears the colours (at quality 40, 1 in 4
// pixels of a band was read as another band or none). The charts are flat colours
// and lines, so lossless costs only about a quarter more bytes.
export default function compressRainImage(image: Buffer): Promise<Buffer> {
  return sharp(image, sharpInputOptions)
    .webp({ lossless: true })
    .extract(rainCrop)
    .toBuffer()
}
