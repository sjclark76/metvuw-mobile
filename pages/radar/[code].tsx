import { GetServerSideProps } from 'next'
import { GetServerSidePropsResult } from 'next/types'
import { SeoMeta, SeoMetaProps } from '../../components/SeoMeta'
import { RadarChartData } from '../api/types/radarChartData'
import WeatherImage from '../../components/WeatherImage'
import { format } from 'date-fns'
import { downloadRadarChartData } from '../api/helpers/s3Helper'
import { config } from '../../config'
import { RadarCode } from '../../shared/radarRegions'
import { useSetAtom } from 'jotai/index'
import { submenuTextAtom } from '../../components/Atoms/GlobalState'

export interface RadarPageProps {
  images: RadarChartData[]
  meta: SeoMetaProps
}
export default function Radar(props: RadarPageProps) {
  // const setSubmenuText = useSetAtom(submenuTextAtom)

  // setSubmenuText(`Radar Chart for ${props.images[0].radar}`)
  return (
    <>
      <SeoMeta
        title={props.meta.title}
        desc={props.meta.desc}
        imageUrl={props.meta.imageUrl}
        url={props.meta.url}
      />
      <div className="flex flex-col items-center">
        {props.images.map((image) => (
          <div
            key={image.imageDateUTC}
            className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white"
          >
            <WeatherImage
              imageSrc={image.url}
              imageAlt={`satellite chart for ${format(
                new Date(image.imageDateUTC),
                'PPPPp',
              )}`}
              isRainForecast={false}
            />
            <div className="flex items-center rounded-b-lg justify-around py-3 bg-white">
              <span className="text-base font-semibold text-gray-700">
                {format(image.imageDateUTC, 'PPPP')}
              </span>
              <span className="text-center px-2 py-1 w-20 text-xs font-semibold text-white uppercase transition-colors duration-200 transform bg-gray-900 rounded hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
                {format(image.imageDateUTC, 'hh:mm a')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<RadarPageProps> = async (
  context,
) => {
  const radarImagesPromise = downloadRadarChartData({
    Bucket: config.s3.bucketName,
    Key: 'radar.json',
  })

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
