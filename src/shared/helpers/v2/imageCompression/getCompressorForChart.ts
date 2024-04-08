import { compressRadarImage } from '@/shared/helpers/v2/imageCompression/compressRadarImage'
import compressRainImage from '@/shared/helpers/v2/imageCompression/compressRainImage'
import {
  compressSatelliteImage,
  compressSmallSatelliteImage,
} from '@/shared/helpers/v2/imageCompression/compressSatelliteImage'
import {
  compressSmallUpperAirImage,
  compressUpperAirImage,
} from '@/shared/helpers/v2/imageCompression/compressUpperAirImage'
import { ChartType } from '@/shared/types/ChartType'

export const getCompressorForChart = (chartType: ChartType) => {
  switch (chartType) {
    case 'Satellite': {
      return {
        primary: compressSatelliteImage,
        small: compressSmallSatelliteImage,
      }
    }
    case 'Radar':
      return { primary: compressRadarImage }
    case 'Rain':
      return { primary: compressRainImage }
    case 'Upper Air':
      return {
        primary: compressUpperAirImage,
        small: compressSmallUpperAirImage,
      }
    default:
      throw new Error(`unsupported chart type: ${chartType}`)
  }
}
