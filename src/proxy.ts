import { NextRequest, NextResponse } from 'next/server'

import {
  FAVORITE_PAGE_COOKIE,
  isSameOriginPath,
} from '@/shared/helpers/favoritePage'

const DOMESTIC_COUNTRIES = new Set(['NZ'])

const cookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60,
} as const

export function proxy(request: NextRequest) {
  // A visitor with a favourite page never needs the home page: redirect before it
  // is rendered or downloaded. The redirect depends on the cookie, so no shared
  // cache may keep it.
  const favoritePage = request.cookies.get(FAVORITE_PAGE_COOKIE)?.value
  if (
    request.nextUrl.pathname === '/' &&
    favoritePage &&
    favoritePage !== '/' &&
    isSameOriginPath(favoritePage)
  ) {
    const redirect = NextResponse.redirect(new URL(favoritePage, request.url))
    redirect.headers.set('Cache-Control', 'private, no-store')
    return redirect
  }

  const country = request.headers.get('x-vercel-ip-country')
  const response = NextResponse.next()

  // Only write a cookie that is missing or out of date: re-sending an unchanged
  // one adds a Set-Cookie header to every page response for nothing.
  const setIfChanged = (name: string, value: string) => {
    if (request.cookies.get(name)?.value !== value) {
      response.cookies.set(name, value, cookieOptions)
    }
  }

  setIfChanged('geo-country', country ?? 'XX')

  // Show ads for non-domestic countries. In local dev (no header), default to showing ads for testing.
  const isDev = process.env.NODE_ENV === 'development'
  const showAds = country !== null ? !DOMESTIC_COUNTRIES.has(country) : isDev
  setIfChanged('show-ads', showAds ? '1' : '0')

  return response
}

export const config = {
  matcher: [
    {
      // Pages only: not the API, Next's internals, or any file with an
      // extension (robots.txt, sitemap.xml, icons, sw.js, .well-known/...).
      source: '/((?!api/|_next/|.*\\..*).*)',
      // Link prefetches don't need the cookies; the page request sets them.
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
