import { ChartData } from './chartData'
import {
  BalloonLocation,
  BalloonLocationCode,
} from '../../../shared/balloonLocations'

export interface UpperAirChartData extends ChartData {
  balloonLocationCode: BalloonLocationCode
  balloonLocation: BalloonLocation
}
