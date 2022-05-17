import { render, screen } from '@testing-library/react'
import { findRegionByCode } from '../../shared/region'
import { nzRegionCharts } from '../../testing/nz'
import Region from './[name]'
import { createSeoMetaProps } from '../../components/SeoMeta'
describe('<WeatherCharts/>', () => {
  test('should render with our image for the correct day', () => {
    const nzRegion = findRegionByCode('nz')
    render(
      <Region
        meta={createSeoMetaProps(
          nzRegion,
          nzRegionCharts[0].url,
          'http://localhost:3002'
        )}
        region={nzRegion}
        charts={nzRegionCharts}
      />
    )

    expect(
      screen.getByRole('img', {
        name: /new zealand forecast chart for tuesday, may 17th, 2022 at 12:00 pm/i,
      })
    ).toBeInTheDocument()
  })
})
