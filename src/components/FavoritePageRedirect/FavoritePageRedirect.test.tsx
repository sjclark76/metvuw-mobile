import { render } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { usePathname, useRouter } from 'next/navigation'

import { favoritePageAtom } from '@/components/Atoms/GlobalState'

import FavoritePageRedirect from './FavoritePageRedirect'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}))

const replace = vi.fn()

function renderAt(pathname: string, favoritePage: string | null) {
  vi.mocked(usePathname).mockReturnValue(pathname)
  vi.mocked(useRouter).mockReturnValue({ replace } as unknown as ReturnType<
    typeof useRouter
  >)
  const store = createStore()
  store.set(favoritePageAtom, favoritePage)
  return render(
    <Provider store={store}>
      <FavoritePageRedirect />
    </Provider>,
  )
}

const cookieHeader = () => document.cookie

describe('<FavoritePageRedirect />', () => {
  beforeEach(() => {
    replace.mockClear()
    localStorage.clear()
    document.cookie = 'favorite-page=; Path=/; Max-Age=0'
  })

  // The proxy reads this cookie to redirect the home page before it renders.
  describe('favorite-page cookie', () => {
    test('is set for the favourite page', () => {
      renderAt('/satellite', '/regions/nzsi')

      expect(cookieHeader()).toContain('favorite-page=%2Fregions%2Fnzsi')
    })

    test('is set on any page, so existing favourites reach it on their next visit', () => {
      // A favourite saved before the cookie existed is only in localStorage.
      localStorage.setItem('favoritePage', JSON.stringify('/radar/nl'))
      vi.mocked(usePathname).mockReturnValue('/regions/nz')
      vi.mocked(useRouter).mockReturnValue({
        replace,
      } as unknown as ReturnType<typeof useRouter>)

      render(
        <Provider store={createStore()}>
          <FavoritePageRedirect />
        </Provider>,
      )

      expect(cookieHeader()).toContain('favorite-page=%2Fradar%2Fnl')
    })

    test('is cleared when the favourite is unset', () => {
      document.cookie = 'favorite-page=%2Fregions%2Fnzsi; Path=/'

      renderAt('/satellite', null)

      expect(cookieHeader()).not.toContain('favorite-page')
    })

    test('never holds an unsafe page', () => {
      renderAt('/satellite', '//evil.example')

      expect(cookieHeader()).not.toContain('evil')
    })
  })

  test('sends the home page to the favourite page', () => {
    renderAt('/', '/regions/nzsi')

    expect(replace).toHaveBeenCalledWith('/regions/nzsi')
  })

  test('leaves every other page alone', () => {
    renderAt('/satellite', '/regions/nzsi')

    expect(replace).not.toHaveBeenCalled()
  })

  test('does nothing without a favourite, or with the home page as favourite', () => {
    renderAt('/', null)
    renderAt('/', '/')

    expect(replace).not.toHaveBeenCalled()
  })

  // localStorage can hold anything, so the effect applies the same same-origin
  // rule as the inline script instead of trusting the stored value.
  test.each([
    '//evil.example/phish',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'regions/nzsi',
    '',
  ])('ignores the unsafe favourite %j', (favoritePage) => {
    renderAt('/', favoritePage)

    expect(replace).not.toHaveBeenCalled()
  })
})
