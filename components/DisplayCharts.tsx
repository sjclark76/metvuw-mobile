import { Chart } from './Chart'
import { format } from 'date-fns'
import { useContext, useEffect } from 'react'
import { GlobalContext } from './GlobalProvider'
import { Region } from '../shared/region'
import { RainChartData } from '../pages/api/rainChartData'
interface DisplayChartsProps {
  region: Region
  charts: RainChartData[]
}

export const DisplayCharts = (props: DisplayChartsProps) => {
  const { setSubmenuText } = useContext(GlobalContext)

  useEffect(() => {
    const submenuText = `Forecast issued at ${format(
      new Date(props.charts[0].issueDate),
      'PPPPp'
    )} for ${props.region.name}`

    setSubmenuText(submenuText)
  }, [props.region])

  return (
    <>
      <div className="flex flex-col items-center">
        {props.charts.map((chart) => (
          <Chart key={chart.forecastDate} chart={chart} region={props.region} />
        ))}
      </div>
    </>
  )
}
