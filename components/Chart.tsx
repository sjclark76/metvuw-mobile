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
        <p>{JSON.stringify(props.chart, null, 2)}</p>
        <p className="text-base text-center text-gray-800 my-4">
          {/*{new Date(props.chart.forecastDate).toISOString()}*/}
        </p>
      </div>
    </div>
  )
}
