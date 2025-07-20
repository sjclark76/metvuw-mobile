'use client'
import { format } from 'date-fns'

import Card from '@/components/Card'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import WeatherImage from '../WeatherImage/WeatherImage'

interface Props {
  chart: SkinnyRainChartData
  region: Region
  index: number
}

export function WeatherChart(props: Props) {
  const altTag = `${props.region.name} forecast chart for ${format(
    new Date(props.chart.forecastDate),
    'PPPPp',
  )}`
  const forecastDate = new Date(props.chart.forecastDate)

  return (
    <Card
      weatherImage={
        <WeatherImage
          imageSrc={props.chart.url}
          imageAlt={altTag}
          chartType="Rain"
          isHighPriority={props.index === 0}
        />
      }
      date={
        <div className="flex items-center justify-center gap-x-1 text-sm font-semibold text-gray-700 sm:text-base dark:text-stone-100">
          <span className="w-20 text-left">
            {format(forecastDate, 'MMMM do')}
          </span>
          <span className="w-12 text-left">{format(forecastDate, 'yyyy')}</span>
        </div>
      }
      time={
        <div className="flex items-center justify-center gap-x-1 text-center text-xs font-semibold text-white">
          <span className="w-20 transform rounded-sm bg-sky-600 px-1 py-1">
            {format(forecastDate, 'EEEE')}
          </span>
          <span className="w-20 transform rounded-sm bg-gray-900 px-1 py-1 font-mono uppercase dark:bg-stone-200 dark:text-stone-700">
            {format(forecastDate, 'hh:mm a')}
          </span>
        </div>
      }
    />
  )
}
