import { ChartData } from './chartData'
import { RadarCode, RadarRegion } from './radarRegions'

export interface RadarChartData extends ChartData {
  radarCode: RadarCode
  radar: RadarRegion
}
