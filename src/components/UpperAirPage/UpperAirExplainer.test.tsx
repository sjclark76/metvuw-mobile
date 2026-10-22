import { fireEvent, render, screen } from '@testing-library/react'

import { UpperAirExplainer } from './UpperAirExplainer'

describe('<UpperAirExplainer />', () => {
  test('is closed until it is opened', () => {
    const { container } = render(<UpperAirExplainer />)

    expect(container.querySelector('details')).not.toHaveAttribute('open')
    expect(screen.getByText('What are these charts?').tagName).toBe('SUMMARY')
  })

  test('says what the balloons are, where and when they are launched', () => {
    render(<UpperAirExplainer />)

    expect(screen.getByText(/Weather balloons/)).toHaveTextContent(
      /11am and 11pm New Zealand standard time from Whenuapai, Paraparaumu and Invercargill/,
    )
  })

  test('says what a tephigram is and when new ones appear', () => {
    render(<UpperAirExplainer />)

    expect(
      screen.getByText(/tephigram: a graph of how the temperature/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/2:00 to 2:40 am and 2:00 to 2:40 pm/),
    ).toBeInTheDocument()
  })

  test('says the times are standard time, and what the clocks do in summer', () => {
    render(<UpperAirExplainer />)

    expect(
      screen.getByText(/New Zealand standard time: while daylight/),
    ).toHaveTextContent(
      /clocks are an hour ahead \(the charts are labelled NZDT then\)/,
    )
  })

  test('counts it being opened, not closed', () => {
    window.gtag = vi.fn()
    const { container } = render(<UpperAirExplainer />)
    const details = container.querySelector('details')!

    details.open = true
    fireEvent(details, new Event('toggle'))
    details.open = false
    fireEvent(details, new Event('toggle'))

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect(window.gtag).toHaveBeenCalledWith('event', 'help_opened', {
      help: 'upper_air',
    })
    delete window.gtag
  })
})
