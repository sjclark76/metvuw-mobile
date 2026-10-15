import { ChartData } from './chartData'

interface RainChartData extends ChartData {
  forecastDate: string
  offset: number
}

export type SkinnyRainChartData = Pick<
  RainChartData,
  'imageDateUTC' | 'forecastDate' | 'url'
>
