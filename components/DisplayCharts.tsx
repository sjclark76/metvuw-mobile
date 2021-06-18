import { ChartResponse } from '../pages/api/charts/[region]'
import { Chart } from './Chart'
import { format } from 'date-fns'
import { useContext } from 'react'
import { GlobalContext } from './GlobalProvider'
import { Region } from '../shared/region'
interface DisplayChartsProps {
  region: Region
  charts: ChartResponse[]
}

export const DisplayCharts = (props: DisplayChartsProps) => {
  const { setSubmenuText } = useContext(GlobalContext)
  const submenuText = `Forecast issued at ${format(
    new Date(props.charts[0].issueDate),
    'PPPPp'
  )} for ${props.region.name}`
  setSubmenuText(submenuText)
  return (
    <>
      <div className="flex flex-col items-center">
        {props.charts.map((chart) => (
          <Chart chart={chart} region={props.region} />
        ))}
      </div>
    </>
  )
}
