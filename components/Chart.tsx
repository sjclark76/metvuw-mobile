import { format } from 'date-fns'
import { Region } from '../shared/region'
import { WeatherImage } from './WeatherImage'
import { RainChartData } from '../pages/api'

interface ChartsProps {
  chart: RainChartData
  region: Region
}

export const Chart = (props: ChartsProps) => {
  const altTag = `${props.region.name} forecast chart for ${format(
    new Date(props.chart.forecastDate),
    'PPPPp'
  )}`
  const forecastDate = new Date(props.chart.forecastDate)

  return (
    <div className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white">
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
