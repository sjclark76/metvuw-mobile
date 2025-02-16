import { render } from '@testing-library/react'

import WeatherImage from './WeatherImage'

describe('Weather Image', () => {
  test('it should render correctly', () => {
    const { container } = render(
      <WeatherImage
        chartType="Rain"
        imageAlt="foo"
        imageSrc="baa"
        isLazy={false}
      />,
    )

    expect(container).toMatchSnapshot()
  })
})
