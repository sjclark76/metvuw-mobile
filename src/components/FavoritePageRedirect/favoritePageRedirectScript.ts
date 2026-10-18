/**
 * Sends the home page to the visitor's favourite page. `favoritePage` lives in
 * localStorage (see favoritePageAtom), which the server can't read, so the
 * server always renders the home page. Redirecting from a post-hydration effect
 * therefore flashes the home page's charts before the favourite page loads.
 * Serialised into an inline script (see favoritePageRedirectScript) that runs
 * before the page paints, so it must stay self-contained: no imports, helpers
 * or closed-over variables.
 */
export function redirectToFavoritePage(
  storage: Pick<Storage, 'getItem'>,
  location: Pick<Location, 'pathname' | 'replace'>,
) {
  try {
    if (location.pathname !== '/') return
    const favoritePage = JSON.parse(storage.getItem('favoritePage') || 'null')
    // Same-origin paths only; '//host' would be a protocol-relative URL, and
    // browsers read '/\host' the same way.
    if (
      typeof favoritePage === 'string' &&
      favoritePage.length > 1 &&
      favoritePage.charAt(0) === '/' &&
      favoritePage.charAt(1) !== '/' &&
      favoritePage.charAt(1) !== '\\'
    ) {
      location.replace(favoritePage)
    }
  } catch {
    // Unreadable storage or malformed JSON: stay on the home page.
  }
}

export const favoritePageRedirectScript = `(${redirectToFavoritePage.toString()})(localStorage,location)`
