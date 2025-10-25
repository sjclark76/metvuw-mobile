// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface VercelNextRequest extends NextRequest {
  geo?: {
    city?: string
    country?: string
    region?: string
    latitude?: string
    longitude?: string
  }
}

export function middleware(request: NextRequest) {
  const vercelRequest = request as VercelNextRequest
  const country = vercelRequest.geo?.country || 'UNKNOWN'

  const response = NextResponse.next()
  response.headers.set('x-user-country', country)

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
