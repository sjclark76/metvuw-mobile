import { act, renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { ReactNode } from 'react'

import { savedPagesAtom } from '@/components/Atoms/GlobalState'
import {
  collectGarbage,
  downloadPage,
  SavedPage,
} from '@/shared/helpers/offline/savedPages'

import { useSavedPage, useSavedPageList } from './useSavedPages'

vi.mock('@/shared/helpers/offline/savedPages', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/shared/helpers/offline/savedPages')
  >()),
  downloadPage: vi.fn(),
  collectGarbage: vi.fn(),
}))

vi.mock('./browserDependencies', () => ({
  browserDependencies: () => ({ now: () => 0 }),
  supportsSavingPages: () => true,
}))

const chart = '/api/fallback-image?url=c1'
const page = (path: string, title = path): SavedPage => ({
  path,
  title,
  issued: 1,
  refreshedAt: 1,
  urls: [chart],
  bytes: 10,
})

function setup(initial: SavedPage[] = []) {
  const store = createStore()
  store.set(savedPagesAtom, initial)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, wrapper }
}
const savedPaths = (store: ReturnType<typeof createStore>) =>
  (store.get(savedPagesAtom) as SavedPage[]).map((p) => p.path)

describe('useSavedPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(collectGarbage).mockResolvedValue()
  })

  test('is not saved to begin with', () => {
    const { wrapper } = setup()

    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    expect(result.current.saved).toBeUndefined()
    expect(result.current.status).toBe('idle')
  })

  test('knows a page that is saved', () => {
    const { wrapper } = setup([page('/regions/nz')])

    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    expect(result.current.saved?.path).toBe('/regions/nz')
  })

  test('saving downloads the page, remembers it, and tidies up', async () => {
    const { store, wrapper } = setup()
    vi.mocked(downloadPage).mockResolvedValue(page('/regions/nz', 'NZ'))
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.save())

    expect(downloadPage).toHaveBeenCalledWith('/regions/nz', expect.anything())
    expect(savedPaths(store)).toEqual(['/regions/nz'])
    expect(result.current.status).toBe('idle')
    expect(collectGarbage).toHaveBeenCalled()
  })

  test('shows it is saving while it downloads', async () => {
    const { wrapper } = setup()
    let finish: (page: SavedPage) => void = () => {}
    vi.mocked(downloadPage).mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    )
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    let saving: Promise<void> = Promise.resolve()
    act(() => {
      saving = result.current.save()
    })
    expect(result.current.status).toBe('saving')

    await act(async () => {
      finish(page('/regions/nz'))
      await saving
    })
    expect(result.current.status).toBe('idle')
  })

  test('saving the same page again replaces it rather than adding another', async () => {
    const { store, wrapper } = setup([page('/regions/nz', 'old')])
    vi.mocked(downloadPage).mockResolvedValue(page('/regions/nz', 'new'))
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.save())

    expect(store.get(savedPagesAtom)).toEqual([page('/regions/nz', 'new')])
  })

  test('says so, and saves nothing, when the download fails', async () => {
    const { store, wrapper } = setup()
    vi.mocked(downloadPage).mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.save())

    expect(result.current.status).toBe('failed')
    expect(savedPaths(store)).toEqual([])
  })

  test('a failed save can be tried again', async () => {
    const { wrapper } = setup()
    vi.mocked(downloadPage)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page('/regions/nz'))
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.save())
    await act(() => result.current.save())

    expect(result.current.status).toBe('idle')
    expect(result.current.saved).toBeDefined()
  })

  test('removing forgets the page and tidies up', async () => {
    const { store, wrapper } = setup([page('/regions/nz'), page('/satellite')])
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.remove())

    expect(savedPaths(store)).toEqual(['/satellite'])
    expect(collectGarbage).toHaveBeenCalledWith(
      [expect.objectContaining({ path: '/satellite' })],
      expect.anything(),
    )
  })

  test('a failure while tidying does not undo a removal', async () => {
    const { store, wrapper } = setup([page('/regions/nz')])
    vi.mocked(collectGarbage).mockRejectedValue(new Error('cache gone'))
    const { result } = renderHook(() => useSavedPage('/regions/nz'), {
      wrapper,
    })

    await act(() => result.current.remove())

    expect(savedPaths(store)).toEqual([])
  })
})

describe('useSavedPageList', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(collectGarbage).mockResolvedValue()
  })

  test('lists what is saved, ignoring junk in storage', () => {
    const { wrapper } = setup([page('/a'), null, 'x'] as unknown as SavedPage[])

    const { result } = renderHook(() => useSavedPageList(), { wrapper })

    expect(result.current.pages.map((p) => p.path)).toEqual(['/a'])
  })

  test('removes a page by its path', async () => {
    const { store, wrapper } = setup([page('/a'), page('/b')])
    const { result } = renderHook(() => useSavedPageList(), { wrapper })

    await act(() => result.current.remove('/a'))

    expect(savedPaths(store)).toEqual(['/b'])
  })
})
