'use client'

import { format } from 'date-fns'
import React from 'react'

import { FooterControl } from '@/components/FooterControl'
import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
import SubHeader from '@/components/SubHeader'
import WeatherChartsWithAnimation from '@/components/WeatherCharts/WeatherChartsWithAnimation'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface RegionPageProps {
  region: Region
  rainChartData: SkinnyRainChartData[]
}

export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  const submenuText =
    rainChartData.length > 0
      ? `Forecast issued at ${format(
          new Date(rainChartData[0].imageDateUTC),
          'PPPPp',
        )} for ${region.name}`
      : ''

  usePreloadedImages(rainChartData)

  return (
    // This outer div will manage the layout for content and the sticky footer.
    // It takes at least the height of the viewport minus the main navbar's height (approx. 4rem or h-16).
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* This div will contain your main page content and grow to fill available space */}
      <div className="flex-grow">
        <SubHeader submenuText={submenuText} />
        <WeatherChartsWithAnimation region={region} charts={rainChartData} />
      </div>
      <FooterControl charts={rainChartData} />
    </div>
  )
}
