import { config } from '../config'
import { SeoMetaProps } from '../components/SeoMeta'
import { SatelliteChartData } from './api/types/satelliteChartData'
import { downloadSatelliteChartData } from './api/helpers/s3Helper'
import { GetServerSideProps } from 'next'
import { GetServerSidePropsResult } from 'next/types'
import RadarAndSatelliteImages from '../components/RadarAndSatelliteImages'

export interface SatellitePageProps {
  images: SatelliteChartData[]
  meta: SeoMetaProps
}
export default function Satellite({ images, meta }: SatellitePageProps) {
  return <RadarAndSatelliteImages meta={meta} images={images} />
}

export const getServerSideProps: GetServerSideProps<
  SatellitePageProps
> = async () => {
  const satelliteImagesPromise = downloadSatelliteChartData()

  const serverSideProps: GetServerSidePropsResult<SatellitePageProps> = {
    props: satelliteImagesPromise.then((satelliteImages) => {
      return {
        images: satelliteImages,
        meta: {
          title: `metvuw mobile | Satellite`,
          desc: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
          imageUrl: satelliteImages[0].url,
          url: new URL('satellite', config.baseUrl).href,
        },
      }
    }),
  }

  return serverSideProps
}
