import { createStore } from 'jotai'

import { savedPagesAtom } from '@/components/Atoms/GlobalState'
import {
  collectGarbage,
  Dependencies,
  refreshPage,
  SAVED_LIFETIME_MS,
  SavedPage,
} from '@/shared/helpers/offline/savedPages'

import { syncSavedPages } from './syncSavedPages'

vi.mock('@/shared/helpers/offline/savedPages', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/shared/helpers/offline/savedPages')
  >()),
  refreshPage: vi.fn(),
  collectGarbage: vi.fn(),
}))

const NOW = Date.UTC(2026, 9, 20, 12)
const deps = { now: () => NOW } as Dependencies
const chart = (n: number) => `/api/fallback-image?url=c${n}`

const page = (path: string, overrides: Partial<SavedPage> = {}): SavedPage => ({
  path,
  title: path,
  issued: 1,
  refreshedAt: NOW - 1000,
  urls: [chart(1)],
  bytes: 10,
  ...overrides,
})

const storeWith = (pages: SavedPage[]) => {
  const store = createStore()
  store.set(savedPagesAtom, pages)
  return store
}
const saved = (store: ReturnType<typeof createStore>) =>
  store.get(savedPagesAtom) as SavedPage[]

describe('syncSavedPages', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(collectGarbage).mockResolvedValue()
  })

  test('replaces each saved page with its refreshed version', async () => {
    const store = storeWith([page('/a'), page('/b')])
    vi.mocked(refreshPage).mockImplementation(async (p) => ({
      ...p,
      issued: 2,
      refreshedAt: NOW,
    }))

    await syncSavedPages(store, deps)

    expect(saved(store).map((p) => [p.path, p.issued, p.refreshedAt])).toEqual([
      ['/a', 2, NOW],
      ['/b', 2, NOW],
    ])
  })

  test('keeps a page as it was when it cannot be refreshed, and carries on', async () => {
    const store = storeWith([page('/a'), page('/b')])
    vi.mocked(refreshPage).mockImplementation(async (p) => {
      if (p.path === '/a') throw new Error('upstream down')
      return { ...p, issued: 2 }
    })

    await syncSavedPages(store, deps)

    expect(saved(store).map((p) => [p.path, p.issued])).toEqual([
      ['/a', 1],
      ['/b', 2],
    ])
  })

  test('removes a page that has gone a week without being confirmed current', async () => {
    const stale = page('/stale', { refreshedAt: NOW - SAVED_LIFETIME_MS - 1 })
    const store = storeWith([stale, page('/fresh')])
    vi.mocked(refreshPage).mockRejectedValue(new Error('nothing to be had'))

    await syncSavedPages(store, deps)

    expect(saved(store).map((p) => p.path)).toEqual(['/fresh'])
  })

  test('a stale page that does refresh is kept: refreshing comes first', async () => {
    const stale = page('/stale', { refreshedAt: NOW - SAVED_LIFETIME_MS - 1 })
    const store = storeWith([stale])
    vi.mocked(refreshPage).mockImplementation(async (p) => ({
      ...p,
      refreshedAt: NOW,
    }))

    await syncSavedPages(store, deps)

    expect(saved(store).map((p) => p.path)).toEqual(['/stale'])
  })

  test('does not bring back a page the visitor removed while it was refreshing', async () => {
    const store = storeWith([page('/a')])
    vi.mocked(refreshPage).mockImplementation(async (p) => {
      store.set(savedPagesAtom, [])
      return { ...p, issued: 2 }
    })

    await syncSavedPages(store, deps)

    expect(saved(store)).toEqual([])
  })

  test('tidies the caches afterwards, for what is saved now', async () => {
    const store = storeWith([page('/a')])
    vi.mocked(refreshPage).mockImplementation(async (p) => ({
      ...p,
      issued: 2,
    }))

    await syncSavedPages(store, deps)

    expect(collectGarbage).toHaveBeenCalledWith(
      [expect.objectContaining({ path: '/a', issued: 2 })],
      deps,
    )
  })

  test('does nothing, and touches nothing, when there is nothing saved', async () => {
    const store = storeWith([])

    await syncSavedPages(store, deps)

    expect(refreshPage).not.toHaveBeenCalled()
    expect(collectGarbage).not.toHaveBeenCalled()
  })

  test('ignores junk in storage', async () => {
    const store = createStore()
    store.set(savedPagesAtom, [null, 'x', page('/a')])
    vi.mocked(refreshPage).mockImplementation(async (p) => p)

    await syncSavedPages(store, deps)

    expect(refreshPage).toHaveBeenCalledTimes(1)
  })
})
