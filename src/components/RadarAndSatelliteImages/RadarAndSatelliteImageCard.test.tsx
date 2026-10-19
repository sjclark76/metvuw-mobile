import { act, waitFor } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { getBrowserTimeZone } from '@/shared/helpers/timeZone'
import { SkinnyChartData } from '@/shared/types/chartData'

import { RadarAndSatelliteImageCard } from './RadarAndSatelliteImageCard'

vi.mock('@/shared/helpers/timeZone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/helpers/timeZone')>()),
  getBrowserTimeZone: vi.fn(),
}))

// 2026-10-15 14:00 UTC: Friday 3:00 AM in Auckland, Thursday 10:00 AM in New York.
const image: SkinnyChartData = {
  imageDateUTC: Date.UTC(2026, 9, 15, 14),
  url: 'https://example.com/radar.webp',
}
const ui = (
  <RadarAndSatelliteImageCard
    image={image}
    chartType="Radar"
    isHighPriority={false}
  />
)

// React reports a text mismatch between the HTML and the first client render
// through onRecoverableError, so that is what these tests assert on.
async function hydrate(container: HTMLElement) {
  const onRecoverableError = vi.fn()
  await act(async () => {
    hydrateRoot(container, ui, { onRecoverableError })
  })
  return onRecoverableError
}

describe('<RadarAndSatelliteImageCard /> time zones', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  test('renders in the default zone when there is no browser', () => {
    const html = renderToString(ui)

    expect(html).toContain('Friday, October 16th, 2026')
    expect(html).toContain('03:00')
    expect(html).toContain('>Fri<')
    expect(html).toContain('16 OCT')
    expect(html).toContain(
      'radar chart for Friday, October 16th, 2026 at 3:00 AM',
    )
  })

  test('hydrates without a mismatch, then shows the browser zone', async () => {
    // The zone of the machine rendering the HTML must not leak into it...
    vi.mocked(getBrowserTimeZone).mockReturnValue('UTC')
    const container = document.createElement('div')
    container.innerHTML = renderToString(ui)
    document.body.appendChild(container)

    // ...and the browser is in a different zone from that machine.
    vi.mocked(getBrowserTimeZone).mockReturnValue('America/New_York')
    const onRecoverableError = await hydrate(container)

    await waitFor(() => expect(container).toHaveTextContent('10:00'))
    expect(container).toHaveTextContent('Thu')
    expect(container).toHaveTextContent('15 OCT')
    expect(container.querySelector('img')).toHaveAttribute(
      'alt',
      'radar chart for Thursday, October 15th, 2026 at 10:00 AM',
    )
    expect(onRecoverableError).not.toHaveBeenCalled()
  })
})
