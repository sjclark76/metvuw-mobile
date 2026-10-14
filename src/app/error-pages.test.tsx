import { fireEvent, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import ErrorBoundary from './error'
import GlobalError from './global-error'
import NotFound from './not-found'

describe('root error pages', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('error.tsx shows the alert and retries the failed segment', () => {
    const retry = vi.fn()
    render(<ErrorBoundary error={new Error('boom')} retry={retry} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(retry).toHaveBeenCalledTimes(1)
  })

  // global-error replaces the root layout, so it must render its own document.
  test('global-error.tsx renders its own html and body', () => {
    const html = renderToString(
      <GlobalError error={new Error('boom')} retry={vi.fn()} />,
    )

    expect(html).toMatch(/^<html/)
    expect(html).toContain('<body')
    expect(html).toContain('role="alert"')
    expect(html).toContain('Try again')
  })

  test('not-found.tsx explains the page is missing and links home', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
