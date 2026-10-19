import { act, renderHook } from '@testing-library/react'
import { createStore, Provider, useAtom } from 'jotai'
import { ReactNode } from 'react'

import {
  favoritePageAtom,
  isMenuOpenAtom,
  savedPagesAtom,
  themeAtom,
} from './GlobalState'

const wrapperFor = (store = createStore()) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }

describe('favoritePageAtom', () => {
  beforeEach(() => localStorage.clear())

  test('starts without a favourite', () => {
    const { result } = renderHook(() => useAtom(favoritePageAtom), {
      wrapper: wrapperFor(),
    })

    expect(result.current[0]).toBeNull()
  })

  test('is saved to localStorage, so it survives a reload', () => {
    const { result } = renderHook(() => useAtom(favoritePageAtom), {
      wrapper: wrapperFor(),
    })

    act(() => result.current[1]('/regions/nzsi'))

    expect(JSON.parse(localStorage.getItem('favoritePage')!)).toBe(
      '/regions/nzsi',
    )
  })

  test('is read back from localStorage by a new visit', () => {
    localStorage.setItem('favoritePage', JSON.stringify('/radar/nl'))

    const { result } = renderHook(() => useAtom(favoritePageAtom), {
      wrapper: wrapperFor(),
    })

    expect(result.current[0]).toBe('/radar/nl')
  })

  test('is removed from localStorage when unset', () => {
    localStorage.setItem('favoritePage', JSON.stringify('/radar/nl'))
    const { result } = renderHook(() => useAtom(favoritePageAtom), {
      wrapper: wrapperFor(),
    })

    act(() => result.current[1](null))

    expect(JSON.parse(localStorage.getItem('favoritePage')!)).toBeNull()
    expect(result.current[0]).toBeNull()
  })
})

describe('isMenuOpenAtom', () => {
  beforeEach(() => localStorage.clear())

  test('starts closed and is not remembered between visits', () => {
    const { result } = renderHook(() => useAtom(isMenuOpenAtom), {
      wrapper: wrapperFor(),
    })

    expect(result.current[0]).toBe(false)
    act(() => result.current[1](true))
    expect(localStorage.length).toBe(0)
  })
})

// The theme is saved the same way as the favourite page: jotai's storage atom,
// as JSON, under its own key.
describe('themeAtom', () => {
  beforeEach(() => localStorage.clear())

  test('follows the system until a choice is made', () => {
    const { result } = renderHook(() => useAtom(themeAtom), {
      wrapper: wrapperFor(),
    })

    expect(result.current[0]).toBe('system')
  })

  test.each(['light', 'dark', 'system'] as const)(
    'saves a %s choice as JSON, so it survives a reload',
    (choice) => {
      const { result } = renderHook(() => useAtom(themeAtom), {
        wrapper: wrapperFor(),
      })

      act(() => result.current[1](choice))

      expect(JSON.parse(localStorage.getItem('theme')!)).toBe(choice)
    },
  )

  // Read when the atom is created, which in the browser is before the first
  // render, not after mount: the page applies the theme from this value, and
  // starting from "system" would flash the wrong theme.
  test('is read back from storage on the very first render', async () => {
    localStorage.setItem('theme', JSON.stringify('dark'))
    vi.resetModules()
    const { themeAtom: freshAtom } = await import('./GlobalState')
    const firstRender: string[] = []

    renderHook(
      () => {
        const [theme] = useAtom(freshAtom)
        if (firstRender.length === 0) firstRender.push(theme)
      },
      { wrapper: wrapperFor() },
    )

    expect(firstRender).toEqual(['dark'])
  })

  test('is kept apart from the favourite page', () => {
    const { result } = renderHook(() => useAtom(themeAtom), {
      wrapper: wrapperFor(),
    })

    act(() => result.current[1]('dark'))

    expect(localStorage.getItem('favoritePage')).toBeNull()
  })
})

describe('savedPagesAtom', () => {
  beforeEach(() => localStorage.clear())

  test('starts with nothing saved', () => {
    const { result } = renderHook(() => useAtom(savedPagesAtom), {
      wrapper: wrapperFor(),
    })

    expect(result.current[0]).toEqual([])
  })

  test('is saved as JSON under its own key', () => {
    const { result } = renderHook(() => useAtom(savedPagesAtom), {
      wrapper: wrapperFor(),
    })

    act(() => result.current[1]([{ path: '/regions/nz' }]))

    expect(JSON.parse(localStorage.getItem('savedPages')!)).toEqual([
      { path: '/regions/nz' },
    ])
    expect(localStorage.getItem('favoritePage')).toBeNull()
  })

  test('is read when the atom is created, before the first render', async () => {
    localStorage.setItem('savedPages', JSON.stringify([{ path: '/radar/nl' }]))
    vi.resetModules()
    const { savedPagesAtom: fresh } = await import('./GlobalState')
    const firstRender: unknown[] = []

    renderHook(
      () => {
        const [pages] = useAtom(fresh)
        if (firstRender.length === 0) firstRender.push(pages)
      },
      { wrapper: wrapperFor() },
    )

    expect(firstRender).toEqual([[{ path: '/radar/nl' }]])
  })

  test('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })
    const { result } = renderHook(() => useAtom(savedPagesAtom), {
      wrapper: wrapperFor(),
    })

    expect(() => act(() => result.current[1]([]))).not.toThrow()
    vi.restoreAllMocks()
  })
})
