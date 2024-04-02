import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'
interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}
const WeatherCharts = (props: WeatherChartsProps) => {
  return (
    <>
      <ul className="flex flex-col items-center">
        {props.charts.map((chart) => (
          <WeatherChart
            key={chart.forecastDate}
            chart={chart}
            region={props.region}
          />
        ))}
      </ul>
    </>
  )
}

export default WeatherCharts
