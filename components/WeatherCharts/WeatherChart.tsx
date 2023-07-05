import { format } from 'date-fns'
import { Region } from '../../shared/region'
import { RainChartData } from '../../pages/api/types/rainChartData'
import WeatherImage from '../WeatherImage/WeatherImage'

interface Props {
  chart: RainChartData
  region: Region
}

export function WeatherChart(props: Props) {
  const altTag = `${props.region.name} forecast chart for ${format(
    new Date(props.chart.forecastDate),
    'PPPPp'
  )}`
  const forecastDate = new Date(props.chart.forecastDate)

  return (
    <div className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white  w-full sm:w-4/5  xl:w-1/2 2xl:w-1/2 ">
      <WeatherImage
        imageSrc={props.chart.url}
        imageAlt={altTag}
        isRainForecast={true}
      />
      <div className="flex items-center rounded-b-lg justify-around py-3 bg-white">
        <span className="text-base font-semibold text-gray-700">
          {format(forecastDate, 'PPPP')}
        </span>
        <span className="text-center px-2 py-1 w-20 text-xs font-semibold text-white uppercase transition-colors duration-200 transform bg-gray-900 rounded hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
          {format(forecastDate, 'hh:mm a')}
        </span>
      </div>
    </div>
  )
}
