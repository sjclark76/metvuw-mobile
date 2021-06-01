import { ChartResponse } from '../pages/api/charts/[region]'
import Image from 'next/image'

interface ChartsProps {
  chart: ChartResponse
}

export const Chart = (props: ChartsProps) => {
  return (
    <div className="mt-3 mb-3 filter drop-shadow-2xl ">
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
      {/*<div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">The Coldest Sunset</div>
        <p className="text-grey-darker text-base ">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus
          quia, nulla! Maiores et perferendis eaque, exercitationem praesentium
          nihil.
        </p>
      </div>
      <div className="px-6 py-4">
        <span className="inline-block bg-grey-lighter rounded-full px-3 py-1 text-sm font-semibold text-grey-darker mr-2">
          #photography
        </span>
        <span className="inline-block bg-grey-lighter rounded-full px-3 py-1 text-sm font-semibold text-grey-darker mr-2">
          #travel
        </span>
        <span className="inline-block bg-grey-lighter rounded-full px-3 py-1 text-sm font-semibold text-grey-darker">
          #winter
        </span>
      </div>*/}
    </div>
  )
}
