// middleware.ts (at project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  console.log('🔵 MIDDLEWARE RUNNING for:', request.nextUrl.pathname)

  const country = request.headers.get('x-vercel-ip-country') || 'UNKNOWN'

  console.log('🔵 Country detected:', country)

  const response = NextResponse.next()
  response.headers.set('x-user-country', country)

  console.log('🔵 Set x-user-country header to:', country)

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
