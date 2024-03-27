import { LazyLoadImage } from 'react-lazy-load-image-component'

import { ChartType } from '@/shared/types/ChartType'

import styles from './WeatherImage.module.css'

export interface WeatherImageProps {
  chartType: ChartType
  imageAlt: string
  imageSrc: string | undefined
}

const widthAndHeightMap: Record<ChartType, { width: number; height: number }> =
  {
    Radar: { width: 760, height: 760 },
    Rain: { width: 711, height: 600 },
    Satellite: { width: 840, height: 630 },
    'Upper Air': { width: 760, height: 690 },
  }
const WeatherImage = ({ imageAlt, imageSrc, chartType }: WeatherImageProps) => {
  const rainStyle = {
    minHeight: '85%',
    objectPosition: '0% 62%',
  }

  const satelliteStyle = {
    objectPosition: '0% 0%',
  }

  const widthAndHeight = widthAndHeightMap[chartType]
  const isRainForecast = chartType === 'Rain'
  return (
    <div
      data-testid="weather-image"
      className={isRainForecast ? styles.aspectRatioBox : undefined}
    >
      <LazyLoadImage
        alt={imageAlt}
        {...widthAndHeight}
        src={imageSrc} // use normal <img> attributes as props
        className={isRainForecast ? styles.croppedImage : undefined}
        style={isRainForecast ? rainStyle : satelliteStyle}
      />
    </div>
  )
}
export default WeatherImage
