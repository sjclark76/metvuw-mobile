import { NextRequest, NextResponse } from 'next/server'

const DOMESTIC_COUNTRIES = new Set(['AU'])

export function middleware(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country')
  const response = NextResponse.next()

  response.cookies.set('geo-country', country ?? 'XX', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })

  // Show ads for non-domestic countries. In local dev (no header), default to showing ads for testing.
  const isDev = process.env.NODE_ENV === 'development'
  const showAds = country !== null ? !DOMESTIC_COUNTRIES.has(country) : isDev
  response.cookies.set('show-ads', showAds ? '1' : '0', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)',
  ],
}
