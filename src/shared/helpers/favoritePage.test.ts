import {
  FAVORITE_PAGE_COOKIE,
  favoritePageCookie,
  isSameOriginPath,
} from './favoritePage'

describe('isSameOriginPath', () => {
  test.each(['/regions/nzsi', '/satellite', '/radar/nl', '/upperair/93112'])(
    'accepts %s',
    (path) => {
      expect(isSameOriginPath(path)).toBe(true)
    },
  )

  test.each([
    ['protocol-relative', '//evil.example'],
    ['backslash, which browsers read as a slash', '/\\evil.example'],
    ['absolute url', 'https://evil.example'],
    ['script url', 'javascript:alert(1)'],
    ['relative path', 'regions/nzsi'],
    ['empty string', ''],
  ])('rejects a %s', (_name, path) => {
    expect(isSameOriginPath(path)).toBe(false)
  })
})

describe('favoritePageCookie', () => {
  test('stores the page, encoded, for a year, for the whole site', () => {
    const cookie = favoritePageCookie('/regions/nzsi')

    expect(cookie).toContain(`${FAVORITE_PAGE_COOKIE}=%2Fregions%2Fnzsi`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain(`Max-Age=${365 * 24 * 60 * 60}`)
    expect(cookie).toContain('SameSite=Lax')
  })

  test('is not readable only by the host: the page script needs to set it', () => {
    expect(favoritePageCookie('/satellite')).not.toContain('HttpOnly')
  })

  test('clears the cookie when there is no favourite', () => {
    const cookie = favoritePageCookie(null)

    expect(cookie).toContain(`${FAVORITE_PAGE_COOKIE}=;`)
    expect(cookie).toContain('Max-Age=0')
  })

  test('does not store an unsafe page', () => {
    expect(favoritePageCookie('//evil.example')).toContain('Max-Age=0')
  })
})
