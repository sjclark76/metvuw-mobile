import { render, screen } from '@testing-library/react'

import Card from './Card'

describe('<Card />', () => {
  const renderCard = (isLoading = false) =>
    render(
      <Card
        weatherImage={<img alt="chart" />}
        caption={<p>Mon 13:00</p>}
        isLoading={isLoading}
      />,
    ).container.firstElementChild as HTMLElement

  test('shows the chart with its caption underneath', () => {
    renderCard()

    expect(screen.getByRole('img', { name: 'chart' })).toBeInTheDocument()
    expect(screen.getByText('Mon 13:00')).toBeInTheDocument()
  })

  // The page is the chart's own paper colour, so a chart needs no card around
  // it. A white card with a shadow would put the frame back.
  test('has no card background or shadow around the chart', () => {
    const classes = renderCard().className

    expect(classes).not.toMatch(/\bbg-/)
    expect(classes).not.toMatch(/shadow/)
  })

  test('pulses while loading', () => {
    expect(renderCard(true).className).toContain('animate-pulse')
    expect(renderCard(false).className).not.toContain('animate-pulse')
  })
})
