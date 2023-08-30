import { ChartData } from './chartData'
import { RadarCode, RadarRegion } from '../../../shared/radarRegions'

export interface RadarChartData extends ChartData {
  radarCode: RadarCode
  radar: RadarRegion
}
