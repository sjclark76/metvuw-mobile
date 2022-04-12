import { GetServerSideProps } from 'next'
import { config } from '../config'
import {
  createGeneralSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../components/SeoMeta'
import WeatherImage from '../components/WeatherImage/WeatherImage'
import { format } from 'date-fns'
import { SatelliteChartData } from './api/satelliteChartData'

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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const apiURl = new URL(`api/satellite`, config.baseUrl)
  const response = await fetch(apiURl.href)
  console.log('retrieved response', response.status, response.statusText)
  const satelliteImages: SatelliteChartData[] = JSON.parse(
    '[{"year":2022,"month":3,"day":11,"hour":0,"imageDate":1649635200000,"imageDateIso":"2022-04-11T00:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204110000.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":3,"imageDate":1649646000000,"imageDateIso":"2022-04-11T03:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204110300.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":6,"imageDate":1649656800000,"imageDateIso":"2022-04-11T06:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204110600.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":9,"imageDate":1649667600000,"imageDateIso":"2022-04-11T09:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204110900.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":12,"imageDate":1649678400000,"imageDateIso":"2022-04-11T12:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204111200.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":15,"imageDate":1649689200000,"imageDateIso":"2022-04-11T15:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204111500.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":18,"imageDate":1649700000000,"imageDateIso":"2022-04-11T18:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204111800.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":11,"hour":21,"imageDate":1649710800000,"imageDateIso":"2022-04-11T21:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204112100.jpg","width":"280","height":"210"},{"year":2022,"month":3,"day":12,"hour":0,"imageDate":1649721600000,"imageDateIso":"2022-04-12T00:00:00.000Z","url":"https://www.metvuw.com/satellite/big/202204120000.jpg","width":"280","height":"210"}]'
  ) // await response.json()

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
