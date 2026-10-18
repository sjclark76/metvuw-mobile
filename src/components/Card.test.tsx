import { render } from '@testing-library/react'

import Card from './Card'

describe('<Card />', () => {
  const renderCard = (isLoading = false) =>
    render(
      <Card
        weatherImage={<img alt="chart" />}
        date={<span>Mon</span>}
        time={<span>6pm</span>}
        isLoading={isLoading}
      />,
    ).container.firstElementChild as HTMLElement

  // drop-shadow is a CSS filter that is re-rasterised for each of the ~40
  // image cards; box-shadow is far cheaper and looks the same on a card.
  test('uses a box shadow, not the drop-shadow filter', () => {
    const card = renderCard()

    expect(card.className).toContain('shadow-lg')
    expect(card.className).not.toContain('drop-shadow')
  })

  test('pulses while loading', () => {
    expect(renderCard(true).className).toContain('animate-pulse')
    expect(renderCard(false).className).not.toContain('animate-pulse')
  })
})
