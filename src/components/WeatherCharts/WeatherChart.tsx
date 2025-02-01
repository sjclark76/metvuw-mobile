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
        <p className="text-base font-semibold text-gray-700">
          {format(forecastDate, 'PPPP')}
        </p>
      }
      time={
        <p className="w-20 transform rounded-xs bg-gray-900 px-2 py-1 text-center text-xs font-semibold text-white uppercase transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-hidden">
          {format(forecastDate, 'hh:mm a')}
        </p>
      }
    />
  )
}
