import { ChartData } from './chartData'

export interface RainChartData extends ChartData {
  forecastDate: string
  offset: number
}

export type SkinnyRainChartData = Pick<
  RainChartData,
  'imageDateUTC' | 'forecastDate' | 'url'
>
