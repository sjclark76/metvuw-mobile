import { ChartResponse } from '../pages/api/charts/[region]'
import Image from 'next/image'

interface ChartsProps {
  chart: ChartResponse
}

export const Chart = (props: ChartsProps) => {
  return (
    <div className="flex justify-center py-3 filter drop-shadow-2xl ">
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
    </div>
  )
}
