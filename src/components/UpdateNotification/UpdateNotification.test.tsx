import { act, fireEvent, render, screen } from '@testing-library/react'

import { UpdateNotification } from './UpdateNotification'

type Listener = () => void

// The slice of `window.serwist` (a @serwist/window Serwist) the component uses.
function installFakeSerwist() {
  const listeners = new Map<string, Listener[]>()
  const serwist = {
    register: vi.fn(),
    messageSkipWaiting: vi.fn(),
    addEventListener: vi.fn((type: string, listener: Listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener])
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((l) => l !== listener),
      )
    }),
  }
  Object.assign(window, { serwist })
  const emit = (type: string) =>
    act(() => (listeners.get(type) ?? []).forEach((listener) => listener()))
  return { serwist, emit }
}

describe('<UpdateNotification />', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'serwist')
  })

  test('renders nothing, and does not fail, where there is no service worker', () => {
    const { container } = render(<UpdateNotification reload={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('registers the service worker once the page has mounted', () => {
    const { serwist } = installFakeSerwist()

    render(<UpdateNotification reload={vi.fn()} />)

    expect(serwist.register).toHaveBeenCalledTimes(1)
  })

  test('registers only once, however often it re-renders', async () => {
    const { serwist, emit } = installFakeSerwist()
    const { rerender } = render(<UpdateNotification reload={() => {}} />)

    rerender(<UpdateNotification reload={() => {}} />)
    await emit('waiting')

    expect(serwist.register).toHaveBeenCalledTimes(1)
    expect(serwist.addEventListener).toHaveBeenCalledTimes(2)
  })

  test('says nothing until a new version is waiting', () => {
    installFakeSerwist()

    render(<UpdateNotification reload={vi.fn()} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  test('announces a waiting version politely, without interrupting', async () => {
    const { emit } = installFakeSerwist()
    render(<UpdateNotification reload={vi.fn()} />)

    await emit('waiting')

    expect(screen.getByRole('status')).toHaveTextContent(/new version/i)
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  test('does not reload the page by itself', async () => {
    const reload = vi.fn()
    const { emit } = installFakeSerwist()
    render(<UpdateNotification reload={reload} />)

    await emit('waiting')
    await emit('controlling')

    expect(reload).not.toHaveBeenCalled()
  })

  test('Reload activates the waiting version, then reloads once it controls the page', async () => {
    const reload = vi.fn()
    const { serwist, emit } = installFakeSerwist()
    render(<UpdateNotification reload={reload} />)
    await emit('waiting')

    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))

    expect(serwist.messageSkipWaiting).toHaveBeenCalledTimes(1)
    expect(reload).not.toHaveBeenCalled()

    await emit('controlling')

    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('"Later" dismisses it and leaves the page and the worker alone', async () => {
    const reload = vi.fn()
    const { serwist, emit } = installFakeSerwist()
    render(<UpdateNotification reload={reload} />)
    await emit('waiting')

    fireEvent.click(screen.getByRole('button', { name: 'Later' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(serwist.messageSkipWaiting).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })

  test('stops listening when it unmounts', () => {
    const { serwist } = installFakeSerwist()
    const { unmount } = render(<UpdateNotification reload={vi.fn()} />)

    unmount()

    expect(serwist.removeEventListener).toHaveBeenCalledWith(
      'waiting',
      expect.any(Function),
    )
    expect(serwist.removeEventListener).toHaveBeenCalledWith(
      'controlling',
      expect.any(Function),
    )
  })
})
