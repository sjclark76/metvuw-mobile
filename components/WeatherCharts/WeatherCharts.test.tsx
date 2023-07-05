import { render, screen } from '@testing-library/react'
import WeatherCharts from './WeatherCharts'
import { getByRegionCode } from '../../shared/region'
import { nzRegionCharts } from '../../testing/nz'
describe('<WeatherCharts/>', () => {
  test('should render with our image for the correct day', () => {
    nzRegionCharts
    render(
      <WeatherCharts region={getByRegionCode('nz')} charts={nzRegionCharts} />
    )

    expect(
      screen.getByRole('img', {
        name: /new zealand forecast chart for tuesday, may 17th, 2022 at 12:00 pm/i,
      })
    ).toBeInTheDocument()
  })
})
