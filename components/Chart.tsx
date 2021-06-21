import { ChartResponse } from '../pages/api/charts/[region]'
import Image from 'next/image'
import { format } from 'date-fns'
import { Region } from '../shared/region'
interface ChartsProps {
  chart: ChartResponse
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
      <Image
        //key={index}
        src={props.chart.url}
        alt={altTag}
        layout="intrinsic"
        objectFit="cover"
        objectPosition="0% 70%"
        width={711}
        height={492}
      />
      <div className="flex items-center rounded-b-lg justify-between px-12 py-3 bg-white">
        <span className="text-base font-semibold text-gray-700">
          {format(forecastDate, 'PPPP')}
        </span>
        <span className="text-right px-2 py-1 w-20 text-xs font-semibold text-white uppercase transition-colors duration-200 transform bg-gray-900 rounded hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
          {format(forecastDate, 'p')}
        </span>
      </div>
    </div>
  )
}
