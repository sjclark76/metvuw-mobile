import { RadarCode, RadarRegion } from '../radarRegions'
import { ChartData } from './chartData'

export interface RadarChartData extends ChartData {
  radarCode: RadarCode
  radar: RadarRegion
}
