import { render, screen } from '@testing-library/react'

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
      /11am and 11pm New Zealand time from Whenuapai, Paraparaumu and Invercargill/,
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
})
