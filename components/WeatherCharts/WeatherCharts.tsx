import { format } from 'date-fns'
import { useContext, useEffect } from 'react'
import { GlobalContext } from '../GlobalProvider'
import { Region } from '../../shared/region'
import { RainChartData } from '../../pages/api/types/rainChartData'
import { WeatherChart } from './WeatherChart'
interface WeatherChartsProps {
  region: Region
  charts: RainChartData[]
}
const WeatherCharts = (props: WeatherChartsProps) => {
  const { setSubmenuText } = useContext(GlobalContext)

  useEffect(() => {
    const submenuText = `Forecast issued at ${format(
      new Date(props.charts[0].issueDate),
      'PPPPp'
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
