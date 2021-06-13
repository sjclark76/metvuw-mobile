import { ChartResponse } from '../pages/api/charts/[region]'
import Image from 'next/image'
import { format } from 'date-fns'
interface ChartsProps {
  chart: ChartResponse
}

export const Chart = (props: ChartsProps) => {
  return (
    <div className="pt-5 mb-5 rounded-xl filter drop-shadow-2xl bg-white">
      <Image
        //key={index}
        src={props.chart.url}
        alt="SET ME"
        layout="intrinsic"
        objectFit="cover"
        objectPosition="0% 70%"
        width={711}
        height={492}
      />
      <div className="flex justify-center">
        <ul>
          <li>url {props.chart.url}</li>
          <li>offset {props.chart.offset}</li>
          <li>forecastDate {props.chart.forecastDate}</li>
          <li>issueDate {props.chart.issueDate}</li>
          <li>utcDate {props.chart.utcDate}</li>
          <li>year {props.chart.year}</li>
          <li>month {props.chart.month}</li>
          <li>day {props.chart.day}</li>
          <li>hour {props.chart.hour}</li>
        </ul>
        <p className="text-base text-center text-gray-800 my-4">
          {/*{new Date(props.chart.forecastDate).toISOString()}*/}
        </p>
      </div>
    </div>
  )
}
