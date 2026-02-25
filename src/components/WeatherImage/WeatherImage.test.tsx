import { render } from '@testing-library/react'

import WeatherImage from './WeatherImage'

describe('Weather Image', () => {
  test('it should render correctly', () => {
    const { container } = render(
        <WeatherImage
          chartType="Rain"
          imageAlt="foo"
          imageSrc="baa"
          isHighPriority={false}
        />,
      )

    expect(container).toMatchSnapshot()
  })

  test('satellite proxy image uses small variant srcset', () => {
    const { container } = render(
      <WeatherImage
        chartType="Satellite"
        imageAlt="proxy"
        imageSrc="/api/fallback-image?chartType=Satellite&variant=primary&url=https%3A%2F%2Fmetvuw.com%2Fsatellite%2Fbig%2F2026022500.jpg"
        isHighPriority={false}
      />,
    )

    const image = container.querySelector('img')
    expect(image?.getAttribute('srcset')).toContain('variant=small')
  })
})
