import { ChartResponse } from '../pages/api/charts/[region]'
import { Chart } from './Chart'
interface DisplayChartsProps {
  charts: ChartResponse[]
}

export const DisplayCharts = (props: DisplayChartsProps) => {
  return (
    <div className="pt-2">
      {props.charts.map((chart) => (
        <Chart chart={chart} />
      ))}
    </div>
  )
}
