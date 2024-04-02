import sharp from 'sharp'

export function compressUpperAirImage(image: Buffer): Promise<Buffer> {
  return sharp(image).webp({ quality: 30, preset: 'picture' }).toBuffer()
}
