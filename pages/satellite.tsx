import { config } from '../config'
import { SeoMeta, SeoMetaProps } from '../components/SeoMeta'
import WeatherImage from '../components/WeatherImage/WeatherImage'
import { format } from 'date-fns'
import { SatelliteChartData } from './api/types/satelliteChartData'
import { downloadSatelliteChartData } from './api/helpers/s3Helper'

export interface SatellitePageProps {
  images: SatelliteChartData[]
  meta: SeoMetaProps
}
export default function Satellite(props: SatellitePageProps) {
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
            key={image.imageDate}
            className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white"
          >
            <WeatherImage
              imageSrc={image.url}
              imageAlt={`satellite chart for ${format(
                new Date(image.imageDate),
                'PPPPp'
              )}`}
              isRainForecast={false}
            />
            <div className="flex items-center rounded-b-lg justify-around py-3 bg-white">
              <span className="text-base font-semibold text-gray-700">
                {format(image.imageDate, 'PPPP')}
              </span>
              <span className="text-center px-2 py-1 w-20 text-xs font-semibold text-white uppercase transition-colors duration-200 transform bg-gray-900 rounded hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
                {format(image.imageDate, 'hh:mm a')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export const getStaticProps = async () => {
  console.log('starting s3 download', config.s3.bucketName)
  try {
    const satelliteImages: SatelliteChartData[] =
      await downloadSatelliteChartData({
        Bucket: config.s3.bucketName,
        Key: 'satellite.json',
      })
    console.log('finished s3 download', JSON.stringify(satelliteImages))
    const meta = {
      title: `metvuw mobile | Satellite`,
      desc: `Satellite wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
      imageUrl: satelliteImages[0].url,
      url: new URL('satellite', config.baseUrl).href,
    }

    return {
      props: {
        images: satelliteImages,
        meta,
      },
      revalidate: 1800,
    }
  } catch (e) {
    console.error('an error occured getting static props', e)
  }
}
