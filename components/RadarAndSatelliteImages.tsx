import { SeoMeta, SeoMetaProps } from './SeoMeta'
import WeatherImage from './WeatherImage'
import { format } from 'date-fns'
import { ChartData } from '@shared/types/chartData'
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
            className="mb-5 rounded-xl bg-white pt-5 drop-shadow-2xl filter"
          >
            <WeatherImage
              imageSrc={image.url}
              imageAlt={`satellite chart for ${format(
                new Date(image.imageDateUTC),
                'PPPPp',
              )}`}
              chartType={chartType}
            />
            <div className="flex items-center justify-around rounded-b-lg bg-white py-3">
              <span className="text-base font-semibold text-gray-700">
                {format(image.imageDateUTC, 'PPPP')}
              </span>
              <span className="w-20 transform rounded bg-gray-900 px-2 py-1 text-center text-xs font-semibold uppercase text-white transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
                {format(image.imageDateUTC, 'hh:mm a')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
