import { render, screen, within } from '@testing-library/react'

import { HowToReadChart } from './HowToReadChart'

describe('<HowToReadChart />', () => {
  test('is a labelled section with a heading', () => {
    render(<HowToReadChart />)

    const section = screen.getByRole('region', {
      name: 'How to read this chart',
    })
    expect(
      within(section).getByRole('heading', { name: 'How to read this chart' }),
    ).toBeInTheDocument()
  })

  test('explains the wind barbs, the red pressure lines and the rain colours', () => {
    render(<HowToReadChart />)

    expect(
      screen.getByText(/Wind barbs point into the wind/),
    ).toHaveTextContent('A short feather is 5 knots, a long one 10, a flag 50.')
    expect(
      screen.getByText(/Red lines show air pressure in hPa/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/rain in the last 6 hours, in mm/),
    ).toBeInTheDocument()
  })

  test('has a drawing for each, hidden from a screen reader', () => {
    const { container } = render(<HowToReadChart />)

    const drawings = container.querySelectorAll('li svg')
    expect(drawings).toHaveLength(3)
    drawings.forEach((drawing) =>
      expect(drawing).toHaveAttribute('aria-hidden', 'true'),
    )
  })
})
