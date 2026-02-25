import { NextRequest, NextResponse } from 'next/server'

import { config } from '@/config'
import { getCompressorForChart } from '@/shared/helpers/v2/imageCompression/getCompressorForChart'
import { downloadImageToBuffer } from '@/shared/helpers/v2/imageStorage/downloadImageToBuffer'
import { ChartType } from '@/shared/types/ChartType'

type FallbackImageVariant = 'primary' | 'small'

const validChartTypes: ChartType[] = ['Rain', 'Satellite', 'Radar', 'Upper Air']
const validVariants: FallbackImageVariant[] = ['primary', 'small']

function isChartType(value: string | null): value is ChartType {
  return value != null && validChartTypes.includes(value as ChartType)
}

function isVariant(value: string): value is FallbackImageVariant {
  return validVariants.includes(value as FallbackImageVariant)
}

function getAllowedSourceHosts() {
  return new Set([
    new URL(config.metvuwBaseUrl).hostname,
    new URL(config.cloudFrontUrl).hostname,
  ])
}

export async function GET(request: NextRequest) {
  const sourceUrlParam = request.nextUrl.searchParams.get('url')
  const chartTypeParam = request.nextUrl.searchParams.get('chartType')
  const variantParam =
    request.nextUrl.searchParams.get('variant') ?? ('primary' as const)

  if (!sourceUrlParam) {
    return NextResponse.json(
      { ok: false, message: 'missing url query param' },
      { status: 400 },
    )
  }
  if (!isChartType(chartTypeParam)) {
    return NextResponse.json(
      { ok: false, message: 'invalid chartType query param' },
      { status: 400 },
    )
  }
  if (!isVariant(variantParam)) {
    return NextResponse.json(
      { ok: false, message: 'invalid variant query param' },
      { status: 400 },
    )
  }
  if (!URL.canParse(sourceUrlParam)) {
    return NextResponse.json(
      { ok: false, message: 'invalid source url' },
      { status: 400 },
    )
  }

  const sourceUrl = new URL(sourceUrlParam)
  const allowedHosts = getAllowedSourceHosts()
  if (sourceUrl.protocol !== 'https:' || !allowedHosts.has(sourceUrl.hostname)) {
    return NextResponse.json(
      { ok: false, message: 'source host not allowed' },
      { status: 403 },
    )
  }

  const sourceImage = await downloadImageToBuffer(sourceUrl.href)
  const { primary, small } = getCompressorForChart(chartTypeParam)

  if (variantParam === 'small' && !small) {
    return NextResponse.json(
      { ok: false, message: 'small variant not available for chart type' },
      { status: 400 },
    )
  }

  const transformedImage =
    variantParam === 'small' && small
      ? await small(sourceImage.fileBuffer)
      : await primary(sourceImage.fileBuffer)

  return new NextResponse(new Uint8Array(transformedImage), {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=600, s-maxage=1800, stale-while-revalidate=86400',
    },
  })
}
