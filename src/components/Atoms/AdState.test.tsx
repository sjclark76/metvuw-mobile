import { act, renderHook } from '@testing-library/react'
import { createStore, Provider, useAtomValue } from 'jotai'
import { ReactNode } from 'react'

import { showAdsAtom, useInitShowAds } from './AdState'

const setCookie = (value: string) => {
  document.cookie = `show-ads=${value}; Path=/`
}

function setup() {
  const store = createStore()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  const firstRender: boolean[] = []
  const hook = renderHook(
    () => {
      useInitShowAds()
      const value = useAtomValue(showAdsAtom)
      if (firstRender.length === 0) firstRender.push(value)
      return value
    },
    { wrapper },
  )
  return { ...hook, firstRender }
}

describe('useInitShowAds', () => {
  afterEach(() => {
    document.cookie = 'show-ads=; Path=/; Max-Age=0'
  })

  // The cookie is read after mount so the server render and hydration match.
  test('renders without ads first, whatever the cookie says', () => {
    setCookie('1')

    expect(setup().firstRender).toEqual([false])
  })

  test('shows ads once mounted when the cookie is 1', () => {
    setCookie('1')

    expect(setup().result.current).toBe(true)
  })

  test('shows no ads when the cookie is 0', () => {
    setCookie('0')

    expect(setup().result.current).toBe(false)
  })

  test('shows no ads when there is no cookie', () => {
    expect(setup().result.current).toBe(false)
  })

  test('shows no ads for any other value', () => {
    setCookie('yes')

    expect(setup().result.current).toBe(false)
  })

  test('is not fooled by a cookie that merely ends in show-ads', () => {
    document.cookie = 'not-show-ads=1; Path=/'

    expect(setup().result.current).toBe(false)
    document.cookie = 'not-show-ads=; Path=/; Max-Age=0'
    act(() => {})
  })
})
