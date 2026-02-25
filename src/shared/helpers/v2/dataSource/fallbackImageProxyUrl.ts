import { ChartType } from '@/shared/types/ChartType'

export type FallbackImageVariant = 'primary' | 'small'

export const fallbackImageProxyPath = '/api/fallback-image'

export function buildFallbackImageProxyUrl({
  sourceUrl,
  chartType,
  variant = 'primary',
}: {
  sourceUrl: string
  chartType: ChartType
  variant?: FallbackImageVariant
}) {
  const params = new URLSearchParams({
    url: sourceUrl,
    chartType,
    variant,
  })

  return `${fallbackImageProxyPath}?${params.toString()}`
}

export function isFallbackImageProxyUrl(url: string): boolean {
  const parsed = new URL(url, 'http://localhost')
  return parsed.pathname === fallbackImageProxyPath
}

export function withFallbackImageProxyVariant(
  url: string,
  variant: FallbackImageVariant,
): string | undefined {
  if (!isFallbackImageProxyUrl(url)) {
    return undefined
  }

  const parsed = new URL(url, 'http://localhost')
  parsed.searchParams.set('variant', variant)

  return `${parsed.pathname}?${parsed.searchParams.toString()}`
}
