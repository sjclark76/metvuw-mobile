import { render, screen } from '@testing-library/react'

import NoForecast from './NoForecast'

describe('<NoForecast />', () => {
  test('says there is nothing to show', () => {
    render(<NoForecast />)

    expect(screen.getByText('No forecast to display')).toBeInTheDocument()
  })
})
