import buffer from 'buffer'
import sharp from 'sharp'

import { compressRadarImage } from '@/shared/helpers/v2/imageCompression/compressRadarImage'
import compressRainImage from '@/shared/helpers/v2/imageCompression/compressRainImage'
import { compressSatelliteImage } from '@/shared/helpers/v2/imageCompression/compressSatelliteImage'
import { compressUpperAirImage } from '@/shared/helpers/v2/imageCompression/compressUpperAirImage'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage'

function Image(props: {
  base64String: string
  width: number | undefined
  height: number | undefined
  size: number | undefined
}) {
  const toKB = (bytes: number | undefined) => {
    return bytes ? bytes / 1000 : 0
  }
  return (
    <div>
      <img
        width={props.width}
        height={props.height}
        src={`data:image/webp;base64, ${props.base64String}`}
        alt="test image"
      />
      <div>{toKB(props.size)}kb</div>
    </div>
  )
}

async function OriginalImageAndCompressed({
  image,
  transformer,
}: {
  image: Buffer
  // eslint-disable-next-line no-unused-vars
  transformer?: (i: buffer.Buffer) => Promise<buffer.Buffer>
}) {
  const metaData = await sharp(image).metadata()

  const base64String = new Buffer(image).toString('base64')

  if (transformer) {
    const compressedBuffer = await transformer(image)
    const compressedMetaData = await sharp(compressedBuffer).metadata()

    const compressedBase64String = new Buffer(compressedBuffer).toString(
      'base64',
    )

    return (
      <>
        <Image
          base64String={base64String}
          width={metaData.width}
          height={metaData.height}
          size={metaData.size}
        />
        <Image
          base64String={compressedBase64String}
          width={compressedMetaData.width}
          height={compressedMetaData.height}
          size={compressedMetaData.size}
        />
      </>
    )
  } else {
    return (
      <Image
        base64String={base64String}
        width={metaData.width}
        height={metaData.height}
        size={metaData.size}
      />
    )
  }
}

export default async function Page() {
  const radarBuffer = await downloadImageToBuffer(
    'https://metvuw.com/radar/images/202404021200Z_nl.gif',
  )

  const satelliteBuffer = await downloadImageToBuffer(
    'https://metvuw.com/satellite/big/202404011200.jpg',
  )

  const upperAirBuffer = await downloadImageToBuffer(
    'https://metvuw.com/upperair/202403231200.93112.png',
  )

  const rainBuffer = await downloadImageToBuffer(
    'https://metvuw.com/forecast/2024040212/rain-nz-thumb-2024040212-006.gif',
  )

  return (
    <div className="">
      <OriginalImageAndCompressed
        image={rainBuffer.fileBuffer}
        transformer={compressRainImage}
      />
      <OriginalImageAndCompressed
        image={radarBuffer.fileBuffer}
        transformer={compressRadarImage}
      />
      <OriginalImageAndCompressed
        image={satelliteBuffer.fileBuffer}
        transformer={compressSatelliteImage}
      />
      <OriginalImageAndCompressed
        image={upperAirBuffer.fileBuffer}
        transformer={compressUpperAirImage}
      />
    </div>
  )
}
