import { ChartData } from './chartData'

export interface RainChartData extends ChartData {
  forecastDate: string
  offset: number
}
