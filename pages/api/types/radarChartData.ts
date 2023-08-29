import { ChartData } from './chartData'
import { RadarCode, RadarRegion } from '../../../shared/radarRegions'

export const RadarMap = new Map<string, RadarRegion>([
  ['nl', 'Northland'],
  ['ak', 'Auckland'],
  ['bp', 'Bay of Plenty'],
  ['mh', 'Hawkes Bay'],
  ['np', 'Taranaki'],
  ['wn', 'Wellington'],
  ['ch', 'Christchurch'],
  ['wl', 'Westland'],
  ['nv', 'Southland'],
])

export interface RadarChartData extends ChartData {
  radarCode: RadarCode
  radar?: RadarRegion
}
