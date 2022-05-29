import { render, screen } from '@testing-library/react'
import { findRegionByCode } from '../shared/region'
import { nzRegionCharts } from '../testing/nz'
import Home from './index'

describe('<Home/>', () => {
  it('should render correctly', () => {
    const { asFragment } = render(
      <Home
        meta={{
          title: 'meta-title',
          url: 'meta-url',
          imageUrl: 'meta-image-url',
          desc: 'meta-desc',
        }}
        region={findRegionByCode('nz')}
        charts={nzRegionCharts}
      />
    )

    expect(
      screen.getByRole('img', {
        name: /new zealand forecast chart for tuesday, may 17th, 2022 at 12:00 pm/i,
      })
    ).toBeInTheDocument()

    expect(asFragment()).toMatchSnapshot()
  })
})
