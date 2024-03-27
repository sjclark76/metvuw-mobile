import { NextResponse } from 'next/server'

import { scrapeUpperAirImages } from '@/shared/helpers/screenScraper'
import { UpperAirChartData } from '@/shared/types/upperAirChartData'

export async function GET(): Promise<NextResponse<UpperAirChartData[]>> {
  const result = await scrapeUpperAirImages()

  return NextResponse.json(result)
}
