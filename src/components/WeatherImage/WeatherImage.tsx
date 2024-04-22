import 'react-lazy-load-image-component/src/effects/black-and-white.css'

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

function extraImageAttribute(
  chartType: ChartType,
  imageSrc: string | undefined,
) {
  const smallImageSrc = imageSrc?.replace('images', 'small-images')

  switch (chartType) {
    case 'Satellite':
      return {
        srcSet: `${smallImageSrc} 300w, ${imageSrc} 840w`,
        sizes: '(min-width: 900px) 840px, calc(93.1vw + 21px)',
        ...satelliteImageDimensions,
      }
    case 'Upper Air':
      return {
        srcSet: `${smallImageSrc} 300w, ${imageSrc} 760w`,
        sizes: '(min-width: 820px) 760px, calc(92vw + 24px)',
        ...upperAirImageDimensions,
      }
    case 'Radar':
      return radarImageDimensions
    case 'Rain':
      return rainImageDimensions
    default:
      return null
  }
}

const WeatherImage = ({
  imageAlt,
  imageSrc,
  chartType,
  isLazy,
}: WeatherImageProps) => {
  return (
    <div data-testid="weather-image">
      {isLazy ? (
        <LazyLoadImage
          alt={imageAlt}
          src={imageSrc} // use normal <img> attributes as props
          effect="black-and-white"
          threshold={1000}
          // placeholderSrc="http://127.0.0.1:54321/storage/v1/object/public/dev/images/rain/nz/rain-nz-thumb-2024041512-006.webp"
          {...extraImageAttribute(chartType, imageSrc)}
        />
      ) : (
        <img
          fetchPriority="high"
          alt={imageAlt}
          src={imageSrc}
          {...extraImageAttribute(chartType, imageSrc)}
        />
      )}
    </div>
  )
}
export default WeatherImage
