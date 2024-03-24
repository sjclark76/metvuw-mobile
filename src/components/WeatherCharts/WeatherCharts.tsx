import { Region } from '@shared/region'
import { RainChartData } from '@shared/types/rainChartData'
import { format } from 'date-fns'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'

import { submenuTextAtom } from '../Atoms/GlobalState'
import { WeatherChart } from './WeatherChart'
interface WeatherChartsProps {
  region: Region
  charts: RainChartData[]
}
const WeatherCharts = (props: WeatherChartsProps) => {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  useEffect(() => {
    const submenuText = `Forecast issued at ${format(
      new Date(props.charts[0].imageDateUTC),
      'PPPPp',
    )} for ${props.region.name}`

    setSubmenuText(submenuText)
  }, [props.region, props.charts, setSubmenuText])

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
