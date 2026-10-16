import { act, render } from '@testing-library/react'

import { ReloadWhenOnline } from './ReloadWhenOnline'

const goOnline = () => act(() => void window.dispatchEvent(new Event('online')))

describe('<ReloadWhenOnline />', () => {
  test('renders nothing', () => {
    const { container } = render(<ReloadWhenOnline reload={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('reloads the page when connectivity returns', () => {
    const reload = vi.fn()
    render(<ReloadWhenOnline reload={reload} />)

    goOnline()

    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('does not reload while the page is still offline', () => {
    const reload = vi.fn()
    render(<ReloadWhenOnline reload={reload} />)

    window.dispatchEvent(new Event('offline'))

    expect(reload).not.toHaveBeenCalled()
  })

  test('stops listening when it unmounts', () => {
    const reload = vi.fn()
    const { unmount } = render(<ReloadWhenOnline reload={reload} />)

    unmount()
    goOnline()

    expect(reload).not.toHaveBeenCalled()
  })
})
