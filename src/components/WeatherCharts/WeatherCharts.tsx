import { format } from 'date-fns'
import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { submenuTextAtom } from '../Atoms/GlobalState'
import { WeatherChart } from './WeatherChart'
import { Region } from '@shared/region'
import { RainChartData } from '../../../pages/api/types/rainChartData'
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
      <div className="flex flex-col items-center">
        {props.charts.map((chart) => (
          <WeatherChart
            key={chart.forecastDate}
            chart={chart}
            region={props.region}
          />
        ))}
      </div>
    </>
  )
}

export default WeatherCharts
