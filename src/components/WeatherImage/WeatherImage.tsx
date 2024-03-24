import { ChartType } from '@shared/ChartType'
import { LazyLoadImage } from 'react-lazy-load-image-component'

import styles from './WeatherImage.module.css'

export interface WeatherImageProps {
  imageSrc: string | undefined
  imageAlt: string
  chartType: ChartType
}

const widthAndHeightMap: Record<ChartType, { width: number; height: number }> =
  {
    Rain: { width: 711, height: 600 },
    Radar: { width: 760, height: 760 },
    Satellite: { width: 840, height: 630 },
    'Upper Air': { width: 760, height: 690 },
  }
const WeatherImage = ({ imageAlt, imageSrc, chartType }: WeatherImageProps) => {
  const rainStyle = {
    objectPosition: '0% 62%',
    minHeight: '85%',
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
