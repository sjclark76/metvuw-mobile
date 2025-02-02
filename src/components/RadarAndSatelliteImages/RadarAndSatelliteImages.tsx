/* eslint-disable no-console */
'use client'
import { format } from 'date-fns'

import Card from '@/components/Card'
import WeatherImage from '@/components/WeatherImage'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'
import { ChartType } from '@/shared/types/ChartType'

interface Props {
  images: SkinnyChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
}

export function RadarAndSatelliteImages({ images, chartType }: Props) {
  const createImgAlt = (image: SkinnyChartData) => {
    return `${chartType.toLowerCase()} chart for ${format(
      new Date(image.imageDateUTC),
      'PPPPp',
    )}`
  }

  const safeFormat = (date: number, formatString: string) => {
    try {
      return format(date, formatString)
    } catch {
      console.error(
        `error formatting date date:${date} formatString:${formatString}`,
      )
    }
  }
  return (
    <ul className="flex flex-col items-center">
      {images.map((image, index) => (
        <Card
          key={image.imageDateUTC}
          weatherImage={
            <WeatherImage
              imageSrc={image.url}
              imageAlt={createImgAlt(image)}
              chartType={chartType}
              isLazy={index > 1}
            />
          }
          date={
            <span className="text-base font-semibold text-gray-700">
              {safeFormat(image.imageDateUTC, 'PPPP')}
            </span>
          }
          time={
            <span className="w-20 transform rounded-xs bg-gray-900 px-2 py-1 text-center text-xs font-semibold text-white uppercase transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-hidden">
              {safeFormat(image.imageDateUTC, 'hh:mm a')}
            </span>
          }
        />
      ))}
    </ul>
  )
}
