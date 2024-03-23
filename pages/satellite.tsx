import { config } from '../config'
import { SeoMetaProps } from '../components/SeoMeta'
import { SatelliteChartData } from './api/types/satelliteChartData'
import { downloadSatelliteChartData } from '@shared/helpers/s3Helper'
import { GetServerSideProps } from 'next'
import { GetServerSidePropsResult } from 'next/types'
import RadarAndSatelliteImages from '../components/RadarAndSatelliteImages'
import { useSetAtom } from 'jotai'
import { submenuTextAtom } from '../components/Atoms/GlobalState'

export interface SatellitePageProps {
  images: SatelliteChartData[]
  meta: SeoMetaProps
}
export default function Satellite({ images, meta }: SatellitePageProps) {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  setSubmenuText(`Satellite Imagery for New Zealand`)

  return (
    <RadarAndSatelliteImages
      meta={meta}
      images={images}
      chartType={'Satellite'}
    />
  )
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
