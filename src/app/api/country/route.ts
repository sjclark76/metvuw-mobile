// app/api/test-country/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const headersList = await headers()
  const country = headersList.get('x-user-country')

  // Get all headers to debug
  const allHeaders: Record<string, string> = {}
  headersList.forEach((value, key) => {
    allHeaders[key] = value
  })

  return NextResponse.json({
    country,
    allHeaders,
  })
}
