import { LazyLoadImage } from 'react-lazy-load-image-component'

import {
  radarImageDimensions,
  rainImageDimensions,
  satelliteImageDimensions,
  upperAirImageDimensions,
} from '@/shared/helpers/v2/imageCompression/imageDimensions'
import { ChartType } from '@/shared/types/ChartType'

export interface WeatherImageProps {
  chartType: ChartType
  imageAlt: string
  imageSrc: string | undefined
  isLazy: boolean
}

export const widthAndHeightMap: Record<
  ChartType,
  { width: number; height: number }
> = {
  Radar: radarImageDimensions,
  Rain: rainImageDimensions,
  Satellite: satelliteImageDimensions,
  'Upper Air': upperAirImageDimensions,
}
const WeatherImage = ({
  imageAlt,
  imageSrc,
  chartType,
  isLazy,
}: WeatherImageProps) => {
  const widthAndHeight = widthAndHeightMap[chartType]
  return (
    <div data-testid="weather-image">
      {isLazy ? (
        <LazyLoadImage
          alt={imageAlt}
          {...widthAndHeight}
          src={imageSrc} // use normal <img> attributes as props
          threshold={500}
        />
      ) : (
        <img alt={imageAlt} {...widthAndHeight} src={imageSrc} />
      )}
    </div>
  )
}
export default WeatherImage
