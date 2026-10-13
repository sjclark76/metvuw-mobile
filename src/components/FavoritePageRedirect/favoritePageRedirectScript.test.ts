import {
  favoritePageRedirectScript,
  redirectToFavoritePage,
} from './favoritePageRedirectScript'

function run(stored: string | null, pathname: string) {
  const replace = vi.fn()
  redirectToFavoritePage({ getItem: () => stored }, { pathname, replace })
  return replace
}

describe('redirectToFavoritePage', () => {
  test('redirects the home page to the stored favourite page', () => {
    expect(run(JSON.stringify('/regions/nzni'), '/')).toHaveBeenCalledWith(
      '/regions/nzni',
    )
  })

  test('does not redirect pages other than the home page', () => {
    expect(
      run(JSON.stringify('/regions/nzni'), '/satellite'),
    ).not.toHaveBeenCalled()
  })

  test('does not redirect when no favourite page is stored', () => {
    expect(run(null, '/')).not.toHaveBeenCalled()
  })

  test('does not redirect when the favourite page is the home page', () => {
    expect(run(JSON.stringify('/'), '/')).not.toHaveBeenCalled()
  })

  test.each([
    ['protocol-relative url', '//evil.example.com'],
    ['absolute url', 'https://evil.example.com'],
    ['empty string', ''],
  ])('ignores a %s', (_name, stored) => {
    expect(run(JSON.stringify(stored), '/')).not.toHaveBeenCalled()
  })

  test('ignores a non-string value', () => {
    expect(
      run(JSON.stringify({ path: '/regions/nzni' }), '/'),
    ).not.toHaveBeenCalled()
  })

  test('swallows unparseable storage values', () => {
    expect(() => run('not json', '/')).not.toThrow()
    expect(run('not json', '/')).not.toHaveBeenCalled()
  })
})

describe('favoritePageRedirectScript', () => {
  test('invokes the redirect function with the browser globals', () => {
    expect(favoritePageRedirectScript).toMatch(
      /^\(function[\s\S]*\)\(localStorage,\s*location\)$/,
    )
  })
})
