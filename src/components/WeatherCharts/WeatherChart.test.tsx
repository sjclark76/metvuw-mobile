import { act, waitFor } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

import { getBrowserTimeZone } from '@/shared/helpers/timeZone'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

vi.mock('@/shared/helpers/timeZone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/helpers/timeZone')>()),
  getBrowserTimeZone: vi.fn(),
}))

// 2026-10-15 14:00 UTC: already Friday 3:00 AM in Auckland, still Thursday
// 10:00 AM in New York.
const chart: SkinnyRainChartData = {
  forecastDate: '2026-10-15T14:00:00.000Z',
  imageDateUTC: Date.UTC(2026, 9, 15, 8),
  url: 'https://example.com/chart.webp',
}
const region = findRegionByCode('nz')!
const ui = <WeatherChart chart={chart} region={region} index={0} />

// React reports a text mismatch between the HTML and the first client render
// through onRecoverableError, so that is what these tests assert on.
async function hydrate(container: HTMLElement) {
  const onRecoverableError = vi.fn()
  await act(async () => {
    hydrateRoot(container, ui, { onRecoverableError })
  })
  return onRecoverableError
}

describe('<WeatherChart /> time zones', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  // The server has no browser zone, so it renders in the default zone.
  test('renders in the default zone when there is no browser', () => {
    const html = renderToString(ui)

    expect(html).toContain('Friday')
    expect(html).toContain('16/10/2026')
    expect(html).toContain('03:00 AM')
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

    await waitFor(() => expect(container).toHaveTextContent('10:00 AM'))
    expect(container).toHaveTextContent('Thursday')
    expect(container).toHaveTextContent('15/10/2026')
    expect(container.querySelector('img')).toHaveAttribute(
      'alt',
      'New Zealand forecast chart for Thursday, October 15th, 2026 at 10:00 AM',
    )
    expect(onRecoverableError).not.toHaveBeenCalled()
  })

  test('leaves a viewer in the default zone unchanged', async () => {
    vi.mocked(getBrowserTimeZone).mockReturnValue('Pacific/Auckland')
    const container = document.createElement('div')
    container.innerHTML = renderToString(ui)
    document.body.appendChild(container)

    const onRecoverableError = await hydrate(container)

    await waitFor(() => expect(container).toHaveTextContent('03:00 AM'))
    expect(container).toHaveTextContent('Friday')
    expect(onRecoverableError).not.toHaveBeenCalled()
  })
})
