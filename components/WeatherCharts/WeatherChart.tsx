import { format } from 'date-fns'
import { Region } from '../../shared/region'
import { RainChartData } from '@shared/types/rainChartData'
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
    <div className="mb-5 w-full rounded-xl bg-white pt-5 drop-shadow-2xl  filter sm:w-4/5  xl:w-1/2 2xl:w-1/2 ">
      <WeatherImage
        imageSrc={props.chart.url}
        imageAlt={altTag}
        chartType="Rain"
      />
      <div className="flex items-center justify-around rounded-b-lg bg-white py-3">
        <span className="text-base font-semibold text-gray-700">
          {format(forecastDate, 'PPPP')}
        </span>
        <span className="w-20 transform rounded bg-gray-900 px-2 py-1 text-center text-xs font-semibold uppercase text-white transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
          {format(forecastDate, 'hh:mm a')}
        </span>
      </div>
    </div>
  )
}
