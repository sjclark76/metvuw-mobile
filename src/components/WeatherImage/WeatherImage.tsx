import { useSetAtom } from 'jotai/index'
import { useEffect, useRef } from 'react'

import { loadedImageStateAtom } from '@/app/regions/[name]/state'
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
  isHighPriority: boolean
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
  isHighPriority,
}: WeatherImageProps) => {
  const setLoadedImageState = useSetAtom(loadedImageStateAtom)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const imageElement = imgRef.current

    const handleLoad = () => {
      if (imageElement?.src) {
        setLoadedImageState((prev) => new Map(prev).set(imageElement.src, true))
      }
    }

    if (imageElement) {
      if (imageElement.complete) {
        handleLoad()
      } else {
        imageElement.addEventListener('load', handleLoad)
      }
    }

    return () => {
      if (imageElement) {
        imageElement.removeEventListener('load', handleLoad)
      }
    }
  }, [imageSrc, setLoadedImageState])

  const attributes = extraImageAttribute(chartType, imageSrc)

  if (!imageSrc) {
    return (
      <div data-testid="weather-image-placeholder">Image not available</div>
    )
  }

  const commonProps = {
    src: imageSrc,
    ...attributes,
    style: {
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      ...(attributes &&
      typeof attributes === 'object' &&
      'style' in attributes &&
      typeof attributes.style === 'object'
        ? attributes.style
        : {}),
    },
  }

  return (
    <div data-testid="weather-image" className="w-full">
      <img
        ref={imgRef}
        alt={imageAlt}
        {...commonProps}
        fetchPriority={isHighPriority ? 'high' : 'low'}
      />
    </div>
  )
}
export default WeatherImage
