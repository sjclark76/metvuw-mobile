import { SeoMeta, SeoMetaProps } from './SeoMeta'
import WeatherImage from './WeatherImage'
import { format } from 'date-fns'
import { ChartData } from '../pages/api/types/chartData'
import { ChartType } from '../shared/ChartType'

interface Props {
  images: ChartData[]
  chartType: ChartType
  meta: SeoMetaProps
}
export default function RadarAndSatelliteImages({
  images,
  chartType,
  meta: { desc, imageUrl, title, url },
}: Props) {
  return (
    <>
      <SeoMeta title={title} desc={desc} imageUrl={imageUrl} url={url} />
      <div className="flex flex-col items-center">
        {images.map((image) => (
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
              chartType={chartType}
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