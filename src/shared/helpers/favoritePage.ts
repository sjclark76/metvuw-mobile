// The visitor's favourite page: localStorage holds it for the client, and a
// cookie mirrors it so the proxy can redirect the home page before it renders.
export const FAVORITE_PAGE_COOKIE = 'favorite-page'

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

/**
 * Same-origin paths only. '//host' is a protocol-relative URL, and browsers
 * read a backslash as a slash, so '/\host' would leave the site too.
 */
export function isSameOriginPath(path: string): boolean {
  return (
    path.startsWith('/') && path.charAt(1) !== '/' && path.charAt(1) !== '\\'
  )
}

/** The `document.cookie` string that mirrors `path`, or clears it when unset or unsafe. */
export function favoritePageCookie(path: string | null): string {
  const attributes = 'Path=/; SameSite=Lax'
  if (path === null || !isSameOriginPath(path)) {
    return `${FAVORITE_PAGE_COOKIE}=; ${attributes}; Max-Age=0`
  }
  return `${FAVORITE_PAGE_COOKIE}=${encodeURIComponent(path)}; ${attributes}; Max-Age=${ONE_YEAR_SECONDS}`
}
