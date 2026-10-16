'use client'
import Card from '@/components/Card'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import WeatherImage from '../WeatherImage/WeatherImage'

interface Props {
  chart: SkinnyRainChartData
  region: Region
  index: number
  loading?: 'eager' | 'lazy'
}

export function WeatherChart(props: Props) {
  const formatDate = useFormatDate()
  const forecastDate = new Date(props.chart.forecastDate)
  const altTag = `${props.region.name} forecast chart for ${formatDate(
    forecastDate,
    'PPPPp',
  )}`

  return (
    <Card
      weatherImage={
        <WeatherImage
          imageSrc={props.chart.url}
          imageAlt={altTag}
          chartType="Rain"
          isHighPriority={props.index === 0}
          loading={props.loading}
        />
      }
      date={
        <span className="text-left text-sm font-semibold text-gray-700 sm:text-base dark:text-stone-100">
          {formatDate(forecastDate, 'dd/MM/yyyy')}
        </span>
      }
      time={
        <div className="flex items-center justify-center gap-x-1 text-center text-xs font-semibold text-white">
          <span className="w-20 transform rounded-sm bg-sky-700 px-1 py-1">
            {formatDate(forecastDate, 'EEEE')}
          </span>
          <span className="w-20 transform rounded-sm bg-gray-900 px-1 py-1 font-mono uppercase dark:bg-stone-200 dark:text-stone-700">
            {formatDate(forecastDate, 'hh:mm a')}
          </span>
        </div>
      }
    />
  )
}
