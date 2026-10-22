import { fireEvent, render, screen } from '@testing-library/react'

import { RefreshButton } from './RefreshButton'

describe('<RefreshButton />', () => {
  const reload = vi.fn()

  beforeEach(() => {
    reload.mockClear()
    vi.stubGlobal('location', { ...window.location, reload })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('is a button named for what it does', () => {
    render(<RefreshButton />)

    expect(
      screen.getByRole('button', { name: 'Refresh page' }),
    ).toBeInTheDocument()
  })

  test('reloads the page when pressed', () => {
    render(<RefreshButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh page' }))

    expect(reload).toHaveBeenCalledTimes(1)
  })

  // An installed app has no pull-to-refresh, and a phone brought back to an old
  // page has no other way to reload it, so the button shows at every size.
  test('is shown on small screens too', () => {
    render(<RefreshButton />)

    const classes = screen.getByRole('button').className.split(' ')
    expect(classes).toContain('flex')
    expect(classes).not.toContain('hidden')
    expect(classes).not.toContain('md:flex')
  })

  test('counts the press, sent as a beacon so it gets out as the page reloads', () => {
    window.gtag = vi.fn()
    render(<RefreshButton />)

    fireEvent.click(screen.getByRole('button', { name: 'Refresh page' }))

    expect(window.gtag).toHaveBeenCalledWith('event', 'refresh_pressed', {
      transport_type: 'beacon',
    })
    delete window.gtag
  })
})
