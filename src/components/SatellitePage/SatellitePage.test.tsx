import { fireEvent, render, screen } from '@testing-library/react'

import { SkinnyChartData } from '@/shared/types/chartData'

import { SatellitePage } from './SatellitePage'

const charts = (count: number): SkinnyChartData[] =>
  Array.from({ length: count }, (_, hour) => ({
    imageDateUTC: Date.UTC(2026, 9, 1, hour),
    url: `https://example.com/${hour}.webp`,
  }))

describe('<SatellitePage />', () => {
  test('titles the page and lists every satellite chart', () => {
    render(<SatellitePage satelliteData={charts(4)} />)

    expect(
      screen.getByRole('heading', { name: 'New Zealand' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Satellite imagery')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(4)
  })

  test('offers the animated viewer in a footer, sized to the number of charts', () => {
    render(<SatellitePage satelliteData={charts(4)} />)

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Show animated weather chart'))

    expect(screen.getByLabelText('Chart position')).toHaveAttribute('max', '3')
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })
})
