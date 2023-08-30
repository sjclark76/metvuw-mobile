import { GetServerSideProps } from 'next'
import { GetServerSidePropsResult } from 'next/types'
import { SeoMetaProps } from '../../components/SeoMeta'
import { downloadUpperAirChartData } from '../api/helpers/s3Helper'
import { config } from '../../config'
import { useSetAtom } from 'jotai'
import { submenuTextAtom } from '../../components/Atoms/GlobalState'
import RadarAndSatelliteImages from '../../components/RadarAndSatelliteImages'
import { UpperAirChartData } from '../api/types/upperAirChartData'
import { BalloonLocationCode } from '../../shared/balloonLocations'

export interface UpperAirPageProps {
  images: UpperAirChartData[]
  meta: SeoMetaProps
}
export default function Balloon({ images, meta }: UpperAirPageProps) {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  setSubmenuText(`Upper Air Data for ${images[0].balloonLocation}`)

  return (
    <RadarAndSatelliteImages
      meta={meta}
      images={images}
      chartType={'Upper Air'}
    />
  )
}

export const getServerSideProps: GetServerSideProps<UpperAirPageProps> = async (
  context,
) => {
  const upperAirImagesPromise = downloadUpperAirChartData()

  const balloonLocationCode: BalloonLocationCode | undefined = context.params
    ?.balloon as BalloonLocationCode

  const serverSideProps: GetServerSidePropsResult<UpperAirPageProps> = {
    props: upperAirImagesPromise.then((upperAirImages) => {
      return {
        images: balloonLocationCode
          ? upperAirImages.filter(
              (upperAirImage) =>
                upperAirImage.balloonLocationCode === balloonLocationCode,
            )
          : upperAirImages,
        meta: {
          title: `metvuw mobile | Upper Air Data`,
          desc: `Upper Air Data Optimized for mobile devices. Sourced from metvuw.com`,
          imageUrl: upperAirImages[0].url,
          url: new URL('upperair', config.baseUrl).href,
        },
      }
    }),
  }

  return serverSideProps
}
