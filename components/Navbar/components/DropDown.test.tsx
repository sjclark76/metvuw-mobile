import { render } from '@testing-library/react'
import DropDown from './DropDown'
import { nzRegions } from '../../../shared/region'
import { mapRegionToMenuLink } from '../NavBar'

describe('NavBar Component', () => {
  test('should render correctly', () => {
    const { container } = render(
      <DropDown heading="My Heading" links={mapRegionToMenuLink(nzRegions)} />,
    )

    expect(container).toMatchSnapshot()
  })
})
