'use client'

import { format } from 'date-fns'
import React, { useEffect } from 'react'

import { FooterControl } from '@/components/FooterControl'
import SubHeader from '@/components/SubHeader'
import WeatherCharts from '@/components/WeatherCharts'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'
import { preloadImage } from '@/shared/helpers/images'

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

  useEffect(() => {
    if (rainChartData && rainChartData.length > 0) {
      rainChartData.forEach((chart) => {
        if (chart.url) {
          preloadImage(chart.url)
        }
      })
    }
  }, [rainChartData])

  return (
    // This outer div will manage the layout for content and the sticky footer.
    // It takes at least the height of the viewport minus the main navbar's height (approx. 4rem or h-16).
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* This div will contain your main page content and grow to fill available space */}
      <div className="flex-grow">
        <SubHeader submenuText={submenuText} />
        <WeatherCharts region={region} charts={rainChartData} />
      </div>
      <FooterControl charts={rainChartData} />
    </div>
  )
}
