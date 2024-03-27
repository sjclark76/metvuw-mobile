import { NextResponse } from 'next/server'

import { scrapeRadarImages } from '@/shared/helpers/screenScraper'
import { RadarChartData } from '@/shared/types/radarChartData'

export async function GET(): Promise<NextResponse<RadarChartData[]>> {
  const result = await scrapeRadarImages()

  return NextResponse.json(result)
}
