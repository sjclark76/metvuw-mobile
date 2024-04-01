import { format } from 'date-fns'
import { useSetAtom } from 'jotai'

import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { submenuTextAtom } from '../Atoms/GlobalState'
import { WeatherChart } from './WeatherChart'
interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}
const WeatherCharts = (props: WeatherChartsProps) => {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  // useEffect(() => {
  if (props.charts.length > 0) {
    const submenuText = `Forecast issued at ${format(
      new Date(props.charts[0].imageDateUTC),
      'PPPPp',
    )} for ${props.region.name}`

    setSubmenuText(submenuText)
  } else {
    setSubmenuText('')
  }
  // }, [props.region, props.charts, setSubmenuText])

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
