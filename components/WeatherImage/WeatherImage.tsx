import styles from './WeatherImage.module.css'
import { LazyLoadImage } from 'react-lazy-load-image-component'

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
      <LazyLoadImage
        alt={imageAlt}
        placeholderSrc={
          isRainForecast ? '/placeholder.png' : '/satellite-compressed.jpg'
        }
        // effect="blur"
        src={imageSrc} // use normal <img> attributes as props
        className={isRainForecast ? styles.croppedImage : null}
        style={isRainForecast ? rainStyle : satelliteStyle}
      />
    </div>
  )
}
export default WeatherImage
