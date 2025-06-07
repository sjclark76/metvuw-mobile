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
        ...satelliteImageDimensions, // Contains width & height
      }
    case 'Upper Air':
      return {
        srcSet: `${smallImageSrc} 300w, ${imageSrc} 760w`,
        sizes: '(min-width: 820px) 760px, calc(92vw + 24px)',
        ...upperAirImageDimensions, // Contains width & height
      }
    case 'Radar':
      // Assuming radarImageDimensions contains { width, height }
      // For true responsiveness, consider adding srcSet and sizes if variants exist
      return {
        ...radarImageDimensions,
      }
    case 'Rain':
      // Assuming rainImageDimensions contains { width, height }
      // For true responsiveness, consider adding srcSet and sizes if variants exist
      return {
        ...rainImageDimensions,
      }
    default:
      // Return an empty object to prevent errors when spreading
      return {}
  }
}

const WeatherImage = ({
  imageAlt,
  imageSrc,
  chartType,
  isLazy,
}: WeatherImageProps) => {
  // Get the dynamic attributes for the image
  const attributes = extraImageAttribute(chartType, imageSrc)

  if (!imageSrc) {
    // Handle cases where imageSrc might be undefined
    return (
      <div data-testid="weather-image-placeholder">Image not available</div>
    )
  }

  // Common properties for both lazy and eager loaded images
  const commonProps = {
    src: imageSrc,
    ...attributes, // Spreads width, height, srcSet, sizes
    // Crucial style for responsiveness:
    // Ensures the image scales down within its container, maintaining aspect ratio.
    // The `width` and `height` attributes (from `attributes`) help the browser
    // calculate aspect ratio and reserve space, reducing layout shift.
    // The `sizes` attribute (if present in `attributes`) guides the browser
    // in selecting the correct image from `srcSet` and its intended rendered width.
    style: {
      maxWidth: '100%',
      height: 'auto',
      // If attributes.style exists, merge it. Useful if dimensions objects provide specific styles.
      ...(attributes &&
      typeof attributes === 'object' &&
      'style' in attributes &&
      typeof attributes.style === 'object'
        ? attributes.style
        : {}),
    },
  }

  return (
    <div data-testid="weather-image">
      {isLazy ? (
        <LazyLoadImage
          {...commonProps}
          threshold={200}
          // The `width` and `height` from `commonProps` will be passed through,
          // helping `LazyLoadImage` reserve space.
        />
      ) : (
        <img alt={imageAlt} {...commonProps} fetchPriority="high" />
      )}
    </div>
  )
}
export default WeatherImage
