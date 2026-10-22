import { render } from '@testing-library/react'

import { AppOpenedTracker } from './AppOpenedTracker'

const setStandalone = (standalone: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: standalone && query.includes('standalone'),
  }))

describe('<AppOpenedTracker />', () => {
  beforeEach(() => {
    window.gtag = vi.fn()
    sessionStorage.clear()
  })
  afterEach(() => {
    delete window.gtag
    vi.unstubAllGlobals()
  })

  test('counts a visit from the installed app', () => {
    setStandalone(true)

    render(<AppOpenedTracker />)

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'app_opened_installed',
      undefined,
    )
  })

  test('does not count a visit from a browser tab', () => {
    setStandalone(false)

    render(<AppOpenedTracker />)

    expect(window.gtag).not.toHaveBeenCalled()
  })

  test('counts a visit once, however many pages it opens', () => {
    setStandalone(true)

    render(<AppOpenedTracker />).unmount()
    render(<AppOpenedTracker />)

    expect(window.gtag).toHaveBeenCalledTimes(1)
  })
})
