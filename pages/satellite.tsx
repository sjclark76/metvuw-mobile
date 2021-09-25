import { GetServerSideProps } from 'next'
import { config } from '../config'
import {
  createGeneralSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../components/SeoMeta'
import { WeatherImage } from '../components/WeatherImage'
import { format } from 'date-fns'
import { SatelliteChartData } from './api'

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
          <div className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white">
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const apiURl = new URL(`api/satellite/`, config.baseUrl)
  const response = await fetch(apiURl.href)
  const satelliteImages: SatelliteChartData[] = await response.json()

  const meta = createGeneralSeoMetaProps(
    'Satellite',
    satelliteImages[0].url,
    context
  )

  return {
    props: {
      images: satelliteImages,
      meta,
    }, // will be passed to the page component as props
  }
}
