import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { RainfallLegendSection } from './RainfallLegend'

describe('RainfallLegendSection', () => {
  test('starts collapsed and toggles rainfall legend visibility', async () => {
    render(<RainfallLegendSection />)

    const toggleButton = screen.getByRole('button', {
      name: /show rainfall legend/i,
    })

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/show rainfall legend/i)).not.toBeInTheDocument()
    expect(screen.queryByText('0.1 - 0.5 mm')).not.toBeInTheDocument()

    fireEvent.click(toggleButton)

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('0.1 - 0.5 mm')).toBeInTheDocument()
    expect(screen.getByText('> 200.0 mm')).toBeInTheDocument()
    expect(screen.queryByText('Pale Lavender')).not.toBeInTheDocument()
    expect(screen.queryByText('#FF0000')).not.toBeInTheDocument()
    expect(screen.getByTestId('rainfall-legend-toggle-icon')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /hide rainfall legend/i }))

    await waitFor(() => {
      expect(screen.queryByText('0.1 - 0.5 mm')).not.toBeInTheDocument()
    })
  })
})
