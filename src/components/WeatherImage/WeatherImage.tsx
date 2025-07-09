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
      return {
        ...radarImageDimensions,
      }
    case 'Rain':
      return {
        ...rainImageDimensions,
      }
    default:
      return {}
  }
}

const WeatherImage = ({
  imageAlt,
  imageSrc,
  chartType,
  isLazy,
}: WeatherImageProps) => {
  const attributes = extraImageAttribute(chartType, imageSrc)

  if (!imageSrc) {
    return (
      <div data-testid="weather-image-placeholder">Image not available</div>
    )
  }

  const commonProps = {
    src: imageSrc,
    ...attributes,
    crossOrigin: 'anonymous',
    style: {
      display: 'block', // Make image a block element
      width: '100%', // Make image attempt to fill container width
      maxWidth: '100%', // Ensure it doesn't overflow container
      height: 'auto', // Maintain aspect ratio
      ...(attributes &&
      typeof attributes === 'object' &&
      'style' in attributes &&
      typeof attributes.style === 'object'
        ? attributes.style
        : {}),
    },
  }

  return (
    // Ensure this div takes full width of its parent, constraining the image
    <div data-testid="weather-image" className="w-full">
      {isLazy ? (
        <LazyLoadImage alt={imageAlt} {...commonProps} threshold={200} />
      ) : (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img alt={imageAlt} {...commonProps} fetchPriority="high" />
      )}
    </div>
  )
}
export default WeatherImage
