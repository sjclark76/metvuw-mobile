import { NextRequest, NextResponse } from 'next/server'

import { scrapeRainImages } from '@/shared/helpers/screenScraper'
import { RainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

export async function GET(
  _request: NextRequest,
  { params }: { params: { region: string } },
): Promise<NextResponse<RainChartData[]>> {
  const regionCode = params.region ?? 'nz'

  const region = findRegionByCode(regionCode)

  if (!region)
    return new NextResponse(`invalid region code: ${regionCode}`, {
      status: 404,
    })

  const rainCharts: RainChartData[] = await scrapeRainImages(region)

  return NextResponse.json(rainCharts)
}
