import { useEffect, useRef } from 'react'

import {
  useMarkImageLoaded,
  useMayLoadImage,
} from '@/components/ImageProgress/ImageProgress'
import {
  isFallbackImageProxyUrl,
  withFallbackImageProxyVariant,
} from '@/shared/helpers/dataSource/fallbackImageProxyUrl'
import {
  radarImageDimensions,
  rainImageDimensions,
  satelliteImageDimensions,
  upperAirImageDimensions,
} from '@/shared/helpers/imageCompression/imageDimensions'
import { ChartType } from '@/shared/types/ChartType'

interface WeatherImageProps {
  chartType: ChartType
  imageAlt: string
  imageSrc: string | undefined
  isHighPriority: boolean
  loading?: 'eager' | 'lazy'
}

function extraImageAttribute(
  chartType: ChartType,
  imageSrc: string | undefined,
) {
  const canUseSmallStorageVariant =
    imageSrc != null &&
    imageSrc.includes('/storage/v1/object/public/') &&
    imageSrc.includes('/images/')
  const canUseSmallProxyVariant =
    imageSrc != null && isFallbackImageProxyUrl(imageSrc)
  const smallImageSrc = canUseSmallStorageVariant
    ? imageSrc.replace('/images/', '/small-images/')
    : canUseSmallProxyVariant
      ? withFallbackImageProxyVariant(imageSrc, 'small')
      : undefined

  switch (chartType) {
    case 'Satellite':
      if (!smallImageSrc) {
        return {
          ...satelliteImageDimensions,
        }
      }
      return {
        srcSet: `${smallImageSrc} 300w, ${imageSrc} 840w`,
        sizes: '(min-width: 900px) 840px, calc(93.1vw + 21px)',
        ...satelliteImageDimensions,
      }
    case 'Upper Air':
      if (!smallImageSrc) {
        return {
          ...upperAirImageDimensions,
        }
      }
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

function hasSize(attributes: object): attributes is {
  width: number
  height: number
} {
  return 'width' in attributes && 'height' in attributes
}

const WeatherImage = ({
  imageAlt,
  imageSrc,
  chartType,
  isHighPriority,
  loading,
}: WeatherImageProps) => {
  const markLoaded = useMarkImageLoaded()
  const mayLoad = useMayLoadImage(isHighPriority)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const imageElement = imgRef.current
    // An image with no address yet counts as complete to the browser: it must not be
    // reported as loaded (it would also let every other chart start).
    if (!mayLoad) return

    const handleLoad = () => {
      if (imageSrc) {
        markLoaded(imageSrc)
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
  }, [imageSrc, markLoaded, mayLoad])

  const attributes = extraImageAttribute(chartType, imageSrc)

  if (!imageSrc) {
    return (
      <div data-testid="weather-image-placeholder">Image not available</div>
    )
  }

  // A chart that has to wait for the first one has no address yet, and so no
  // request: `srcSet` (the smaller sizes of the satellite and upper air charts)
  // would start one just the same, so it waits too.
  const waiting = !mayLoad
  const { srcSet, ...otherAttributes } = attributes as { srcSet?: string }
  const commonProps = {
    src: waiting ? undefined : imageSrc,
    ...(waiting ? {} : { srcSet }),
    ...otherAttributes,
    style: {
      display: 'block',
      width: '100%',
      maxWidth: '100%',
      height: 'auto',
      // The room the chart will take, from its size, so a chart that is still
      // waiting for the first to load holds its place: WebKit gives an image with
      // no address no height at all, and the page then jumps as the charts arrive.
      ...(hasSize(otherAttributes)
        ? {
            aspectRatio: `${otherAttributes.width} / ${otherAttributes.height}`,
          }
        : {}),
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
        loading={loading}
        decoding="async"
      />
    </div>
  )
}
export default WeatherImage
