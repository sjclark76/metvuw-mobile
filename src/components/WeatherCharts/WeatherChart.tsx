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
          isLazy={props.index > 1}
        />
      }
      date={
        <p className="text-base font-semibold text-gray-700 dark:text-stone-100">
          {format(forecastDate, 'PPPP')}
        </p>
      }
      time={
        <p className="w-20 transform rounded-sm bg-gray-900 px-1 py-1 text-center text-xs font-semibold text-white uppercase dark:bg-stone-100 dark:text-stone-700">
          {format(forecastDate, 'hh:mm a')}
        </p>
      }
    />
  )
}
