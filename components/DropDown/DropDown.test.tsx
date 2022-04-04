import { render } from '@testing-library/react'
import DropDown from './DropDown'
import { nzLinks } from '../../shared/region'

describe('NavBar Component', () => {
  test('should render correctly', () => {
    const { container } = render(
      <DropDown heading="My Heading" links={nzLinks} />
    )

    expect(container).toMatchSnapshot()
  })
})
