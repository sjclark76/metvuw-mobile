import { act, render } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

import { SavedPagesSync } from './SavedPagesSync'
import { syncSavedPages } from './syncSavedPages'

vi.mock('./syncSavedPages', () => ({ syncSavedPages: vi.fn() }))
const supports = vi.hoisted(() => ({ value: true }))
vi.mock('./browserDependencies', () => ({
  browserDependencies: () => ({}),
  supportsSavingPages: () => supports.value,
}))

const setOnline = (online: boolean) =>
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)

const mount = () =>
  render(
    <Provider store={createStore()}>
      <SavedPagesSync />
    </Provider>,
  )

const becomeVisible = () => {
  Object.defineProperty(document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('<SavedPagesSync />', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(syncSavedPages).mockResolvedValue()
    supports.value = true
    setOnline(true)
    vi.useFakeTimers({ toFake: ['Date'] })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('brings the saved pages up to date when the app opens online', () => {
    mount()

    expect(syncSavedPages).toHaveBeenCalledTimes(1)
  })

  test('waits for a connection when it opens offline', () => {
    setOnline(false)

    mount()

    expect(syncSavedPages).not.toHaveBeenCalled()
  })

  test('does it as soon as the connection comes back', () => {
    setOnline(false)
    mount()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })

    expect(syncSavedPages).toHaveBeenCalledTimes(1)
  })

  test('does nothing where pages cannot be saved', () => {
    supports.value = false

    mount()
    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(syncSavedPages).not.toHaveBeenCalled()
  })

  test('does not start a second sync while one is running', async () => {
    let finish: () => void = () => {}
    vi.mocked(syncSavedPages).mockReturnValue(
      new Promise<void>((resolve) => (finish = resolve)),
    )
    mount()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(syncSavedPages).toHaveBeenCalledTimes(1)

    await act(async () => finish())
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(syncSavedPages).toHaveBeenCalledTimes(2)
  })

  test('coming back to the app checks again, but not every few seconds', async () => {
    mount()
    await act(async () => {})
    expect(syncSavedPages).toHaveBeenCalledTimes(1)

    act(() => becomeVisible())
    expect(syncSavedPages).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(6 * 60 * 1000)
      becomeVisible()
    })
    expect(syncSavedPages).toHaveBeenCalledTimes(2)
  })

  test('a sync that fails does not stop the next one', async () => {
    vi.mocked(syncSavedPages).mockRejectedValueOnce(new Error('cache gone'))
    mount()
    await act(async () => {})

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(syncSavedPages).toHaveBeenCalledTimes(2)
  })

  test('stops listening when it goes', () => {
    const { unmount } = mount()
    unmount()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(syncSavedPages).toHaveBeenCalledTimes(1)
  })
})
