import { GetServerSideProps } from 'next'
import { GetServerSidePropsResult } from 'next/types'
import { SeoMetaProps } from '../../components/SeoMeta'
import { RadarChartData } from '../api/types/radarChartData'
import { downloadRadarChartData } from '../api/helpers/s3Helper'
import { config } from '../../config'
import { RadarCode } from '../../shared/radarRegions'
import { useSetAtom } from 'jotai'
import { submenuTextAtom } from '../../components/Atoms/GlobalState'
import RadarAndSatelliteImages from '../../components/RadarAndSatelliteImages'

export interface RadarPageProps {
  images: RadarChartData[]
  meta: SeoMetaProps
}
export default function Radar({ images, meta }: RadarPageProps) {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  setSubmenuText(`Radar Chart for ${images[0].radar}`)

  return (
    <RadarAndSatelliteImages meta={meta} images={images} chartType={'Radar'} />
  )
}

export const getServerSideProps: GetServerSideProps<RadarPageProps> = async (
  context,
) => {
  const radarImagesPromise = downloadRadarChartData()

  const radarCode: RadarCode | undefined = context.params?.code as RadarCode

  const serverSideProps: GetServerSidePropsResult<RadarPageProps> = {
    props: radarImagesPromise.then((radarImages) => {
      return {
        images: radarCode
          ? radarImages.filter(
              (radarImage) => radarImage.radarCode === radarCode,
            )
          : radarImages,
        meta: {
          title: `metvuw mobile | Radar`,
          desc: `Radar charts. Optimized for mobile devices. Sourced from metvuw.com`,
          imageUrl: radarImages[0].url,
          url: new URL('radar', config.baseUrl).href,
        },
      }
    }),
  }

  return serverSideProps
}
