// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Vercel provides country in this header
  const country = request.headers.get('x-vercel-ip-country') || 'UNKNOWN'

  console.log('Detected country:', country)

  const response = NextResponse.next()
  response.headers.set('x-user-country', country)

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
