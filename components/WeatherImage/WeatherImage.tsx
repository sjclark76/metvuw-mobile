import styles from './WeatherImage.module.css'
import ProgressiveImg from '../ProgressiveImg'

export interface WeatherImageProps {
  imageSrc: string
  imageAlt: string
  isRainForecast: boolean
}
const WeatherImage = ({
  imageAlt,
  imageSrc,
  isRainForecast,
}: WeatherImageProps) => {
  const rainStyle = {
    objectPosition: '0% 62%',
    minHeight: '85%',
  }

  const satelliteStyle = {
    objectPosition: '0% 0%',
  }

  return (
    <div
      data-testid="weather-image"
      className={isRainForecast ? styles.aspectRatioBox : null}
    >
      <ProgressiveImg
        placeholderSrc={
          isRainForecast ? '/placeholder.png' : '/satellite-compressed.jpg'
        }
        loading="lazy"
        alt={imageAlt}
        src={imageSrc}
        decoding="async"
        className={isRainForecast ? styles.croppedImage : null}
        style={isRainForecast ? rainStyle : satelliteStyle}
      />
    </div>
  )
}
export default WeatherImage
