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

describe('<FavoritePageRedirect />', () => {
  beforeEach(() => {
    replace.mockClear()
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
    'https://evil.example',
    'javascript:alert(1)',
    'regions/nzsi',
    '',
  ])('ignores the unsafe favourite %j', (favoritePage) => {
    renderAt('/', favoritePage)

    expect(replace).not.toHaveBeenCalled()
  })
})
