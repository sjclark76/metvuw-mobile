/* eslint-disable no-console */

import { format } from 'date-fns'

import Card from '@/components/Card'
import WeatherImage from '@/components/WeatherImage'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

type Props = {
  image: SkinnyChartData
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
  isHighPriority: boolean
  loading?: 'eager' | 'lazy'
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

function RadarAndSatelliteImageCard({
  image,
  chartType,
  isHighPriority,
  loading,
}: Props) {
  const createImgAlt = (image: SkinnyChartData) => {
    return `${chartType.toLowerCase()} chart for ${format(
      new Date(image.imageDateUTC),
      'PPPPp',
    )}`
  }

  return (
    <Card
      key={image.imageDateUTC}
      weatherImage={
        <WeatherImage
          imageSrc={image.url}
          imageAlt={createImgAlt(image)}
          chartType={chartType}
          isHighPriority={isHighPriority}
          loading={loading}
        />
      }
      date={
        <span className="text-base font-semibold text-gray-700 dark:text-stone-100">
          {safeFormat(image.imageDateUTC, 'PPPP')}
        </span>
      }
      time={
        <span className="w-20 transform rounded-xs bg-gray-900 px-2 py-1 text-center text-xs font-semibold text-white uppercase dark:bg-stone-200 dark:text-stone-700">
          {safeFormat(image.imageDateUTC, 'hh:mm a')}
        </span>
      }
    />
  )
}

export { RadarAndSatelliteImageCard }
