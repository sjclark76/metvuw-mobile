import { BalloonLocation, BalloonLocationCode } from '../balloonLocations'
import { ChartData } from './chartData'

export interface UpperAirChartData extends ChartData {
  balloonLocationCode: BalloonLocationCode
  balloonLocation: BalloonLocation
}
