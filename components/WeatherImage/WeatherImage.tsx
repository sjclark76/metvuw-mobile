import LazyLoad from 'react-lazyload'

export interface WeatherImageProps {
  imageSrc: string
  imageAlt: string
  isRainForecast: boolean
}
const WeatherImage = (props: WeatherImageProps) => {
  const rainStyle = {
    objectPosition: '0% 62%',
  }

  const satelliteStyle = {
    objectPosition: '0% 0%',
  }

  return (
    <div
      data-testid="weather-image"
      className="inline-block max-w-full overflow-hidden relative box-border m-0"
    >
      <div className="box-border block, max-w-full">
        <img
          className="max-w-full block m-0 border-none p-0"
          alt=""
          aria-hidden="true"
          role="presentation"
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzExIiBoZWlnaHQ9IjQ5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
        />
      </div>
      <LazyLoad height={200} offset={600}>
        <img
          alt={props.imageAlt}
          src={props.imageSrc}
          decoding="async"
          className="absolute top-0 left-0 bottom-0 right-0, box-border p-0 border-none m-auto block w-0, h-0 min-w-full max-w-full min-h-full max-h-full object-cover"
          style={props.isRainForecast ? rainStyle : satelliteStyle}
        />
      </LazyLoad>
    </div>
  )
}
export default WeatherImage
