/* eslint-disable no-console -- asserts on the spied console */
import { fireEvent, render, screen } from '@testing-library/react'

import { GeneralError } from './GeneralError'

describe('<GeneralError />', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('announces itself as an alert with a plain explanation', () => {
    render(<GeneralError error={new Error('boom')} retry={vi.fn()} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong/i)
    expect(alert).toHaveTextContent(/try again/i)
  })

  test('re-fetches and re-renders the segment when "Try again" is pressed', () => {
    const retry = vi.fn()
    render(<GeneralError error={new Error('boom')} retry={retry} />)

    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(retry).toHaveBeenCalledTimes(1)
  })

  test('offers a way back to the home page', () => {
    render(<GeneralError error={new Error('boom')} retry={vi.fn()} />)

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  test('logs the error', () => {
    const error = new Error('boom')
    render(<GeneralError error={error} retry={vi.fn()} />)

    expect(console.error).toHaveBeenCalledWith(error)
  })
})
