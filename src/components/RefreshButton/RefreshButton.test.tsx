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

  // Phones refresh by pulling down, so the button only shows from `md` up.
  test('is hidden on small screens', () => {
    render(<RefreshButton />)

    const classes = screen.getByRole('button').className.split(' ')
    expect(classes).toContain('hidden')
    expect(classes).toContain('md:flex')
  })
})
