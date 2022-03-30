import { render } from '@testing-library/react'
import WeatherImage from './WeatherImage'

describe('Weather Image', () => {
  test('it should render correctl', () => {
    const { container } = render(
      <WeatherImage isRainForecast imageAlt="foo" imageSrc="baa" />
    )

    expect(container).toMatchSnapshot()
  })
})
