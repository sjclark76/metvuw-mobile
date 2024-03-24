import { ChartData } from './chartData'
import { BalloonLocation, BalloonLocationCode } from '../balloonLocations'

export interface UpperAirChartData extends ChartData {
  balloonLocationCode: BalloonLocationCode
  balloonLocation: BalloonLocation
}
