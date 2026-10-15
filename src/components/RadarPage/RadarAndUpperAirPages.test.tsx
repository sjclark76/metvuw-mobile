import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { SkinnyChartData } from '@/shared/types/chartData'

import { UpperAirPage } from '../UpperAirPage/UpperAirPage'
import { RadarPage } from './RadarPage'

const charts = (count: number): SkinnyChartData[] =>
  Array.from({ length: count }, (_, hour) => ({
    imageDateUTC: Date.UTC(2026, 9, 1, hour),
    url: `https://example.com/${hour}.webp`,
  }))

const pages = [
  ['radar', <RadarPage key="r" radarData={charts(5)} radarCode="nl" />],
  [
    'upper air',
    <UpperAirPage key="u" chartData={charts(5)} balloonCode="93112" />,
  ],
] as const

// These pages used to have no footer, so the animated viewer was unreachable.
describe.each(pages)('%s page animation', (_name, page) => {
  test('offers the animated viewer in a footer', () => {
    render(page)

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Show animated weather chart'),
    ).toBeInTheDocument()
  })

  test('opens the viewer on one chart, and closes it back to the list', async () => {
    render(page)
    expect(screen.getAllByRole('img')).toHaveLength(5)

    fireEvent.click(screen.getByLabelText('Show animated weather chart'))
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByLabelText('progress bar')).toHaveAttribute('max', '4')

    fireEvent.click(screen.getByLabelText('Show static weather chart list'))
    // The list returns once the viewer's exit animation has finished.
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(5))
  })

  test('steps through the charts', () => {
    render(page)
    fireEvent.click(screen.getByLabelText('Show animated weather chart'))
    const first = screen.getByRole('img').getAttribute('src')

    fireEvent.click(screen.getByLabelText('Step forward'))

    expect(screen.getByRole('img').getAttribute('src')).not.toBe(first)
  })
})
