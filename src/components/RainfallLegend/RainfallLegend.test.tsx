import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { RainfallLegendSection } from './RainfallLegend'

describe('RainfallLegendSection', () => {
  test('lists a swatch for each of metvuw’s twenty bands, in its colours', () => {
    const { container } = render(<RainfallLegendSection />)
    fireEvent.click(
      screen.getByRole('button', { name: /show rainfall legend/i }),
    )

    const swatches = Array.from(
      container.querySelectorAll<HTMLElement>('#rainfall-legend li span'),
    ).map((swatch) => swatch.style.backgroundColor)
    expect(swatches).toHaveLength(20)
    expect(swatches[0]).toBe('rgb(255, 0, 255)')
    expect(swatches[19]).toBe('rgb(255, 63, 0)')
  })

  test('explains how to read the chart under the key', () => {
    render(<RainfallLegendSection />)
    fireEvent.click(
      screen.getByRole('button', { name: /show rainfall legend/i }),
    )

    expect(
      screen.getByRole('region', { name: 'How to read this chart' }),
    ).toBeInTheDocument()
  })

  test('starts collapsed and toggles rainfall legend visibility', async () => {
    render(<RainfallLegendSection />)

    const toggleButton = screen.getByRole('button', {
      name: /show rainfall legend/i,
    })

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/show rainfall legend/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Rain in 6 hours (mm)')).not.toBeInTheDocument()

    fireEvent.click(toggleButton)

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Rain in 6 hours (mm)')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('20+')).toBeInTheDocument()
    expect(screen.queryByText('#FF3F00')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('rainfall-legend-toggle-icon'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /hide rainfall legend/i }),
    )

    await waitFor(() => {
      expect(screen.queryByText('Rain in 6 hours (mm)')).not.toBeInTheDocument()
    })
  })

  test('counts opening the key, not closing it', () => {
    window.gtag = vi.fn()
    render(<RainfallLegendSection />)

    fireEvent.click(
      screen.getByRole('button', { name: /show rainfall legend/i }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /hide rainfall legend/i }),
    )

    expect(window.gtag).toHaveBeenCalledTimes(1)
    expect(window.gtag).toHaveBeenCalledWith('event', 'key_opened', {
      key: 'rainfall',
    })
    delete window.gtag
  })
})
