import { render } from '@testing-library/react'
import DropDown from './DropDown'
import { nzRegions } from '../../shared/region'

describe('NavBar Component', () => {
  test('should render correctly', () => {
    const { container } = render(
      <DropDown heading="My Heading" links={nzRegions} />,
    )

    expect(container).toMatchSnapshot()
  })
})
