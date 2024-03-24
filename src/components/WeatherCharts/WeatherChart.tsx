import { Region } from '@shared/region'
import { RainChartData } from '@shared/types/rainChartData'
import { format } from 'date-fns'

import Card from '@/components/Card'

import WeatherImage from '../WeatherImage/WeatherImage'

interface Props {
  chart: RainChartData
  region: Region
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
        />
      }
      date={
        <p className="text-base font-semibold text-gray-700">
          {format(forecastDate, 'PPPP')}
        </p>
      }
      time={
        <p className="w-20 transform rounded bg-gray-900 px-2 py-1 text-center text-xs font-semibold uppercase text-white transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
          {format(forecastDate, 'hh:mm a')}
        </p>
      }
    />
  )
}
