'use client'
import { format } from 'date-fns'
import { ChartData } from '@shared/types/chartData'
import { ChartType } from '@shared/ChartType'
import WeatherImage from '@/components/WeatherImage'
import Card from '@/components/Card'

interface Props {
  images: ChartData[]
  chartType: ChartType
}

export function RadarAndSatelliteImages({ images, chartType }: Props) {
  return (
    <>
      <div className="flex flex-col items-center">
        {images.map((image) => (
          <Card
            key={image.imageDateUTC}
            weatherImage={
              <WeatherImage
                imageSrc={image.url}
                imageAlt={`satellite chart for ${format(
                  new Date(image.imageDateUTC),
                  'PPPPp',
                )}`}
                chartType={chartType}
              />
            }
            date={
              <span className="text-base font-semibold text-gray-700">
                {format(image.imageDateUTC, 'PPPP')}
              </span>
            }
            time={
              <span className="w-20 transform rounded bg-gray-900 px-2 py-1 text-center text-xs font-semibold uppercase text-white transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
                {format(image.imageDateUTC, 'hh:mm a')}
              </span>
            }
          />
        ))}
      </div>
    </>
  )
}
