import { render } from '@testing-library/react'
import Navbar from './NavBar'

describe('NavBar Component', () => {
  test('should render correctly', () => {
    const { container } = render(<Navbar />)

    expect(container).toMatchSnapshot()
  })
})
