import { act, renderHook } from '@testing-library/react'
import { createStore, Provider, useAtom } from 'jotai'
import { ReactNode } from 'react'

import { favoritePageAtom, isMenuOpenAtom } from './GlobalState'

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
