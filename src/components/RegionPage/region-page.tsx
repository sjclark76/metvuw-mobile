'use client'

import { format } from 'date-fns'
import { useSetAtom } from 'jotai'
import React from 'react'

import { loadedImageStateAtom } from '@/app/regions/[name]/state'
import { useInitShowAds } from '@/components/Atoms/AdState'
import { FooterControl } from '@/components/FooterControl'
import { RainfallLegendSection } from '@/components/RainfallLegend'
import SubHeader from '@/components/SubHeader'
import WeatherChartsWithAnimation from '@/components/WeatherCharts/WeatherChartsWithAnimation'
import { EAGER_IMAGE_COUNT } from '@/shared/helpers/imageLoading'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface RegionPageProps {
  region: Region
  rainChartData: SkinnyRainChartData[]
}

export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  const setLoadedImageState = useSetAtom(loadedImageStateAtom)

  const submenuText =
    rainChartData.length > 0
      ? `Forecast issued at ${format(
          new Date(rainChartData[0].imageDateUTC),
          'PPPPp',
        )} for ${region.name}`
      : ''

  useInitShowAds()

  // Only the eagerly loaded charts count towards the progress bar; lazy ones
  // add themselves as they load, so the bar still reaches 100%.
  setLoadedImageState(
    rainChartData
      .slice(0, EAGER_IMAGE_COUNT)
      .reduce((acc: Map<string, boolean>, chart: SkinnyRainChartData) => {
        acc.set(chart.url, false)
        return acc
      }, new Map<string, boolean>()),
  )

  return (
    // This outer div will manage the layout for content and the sticky footer.
    // It takes at least the height of the viewport minus the main navbar's height (approx. 4rem or h-16).
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* This div will contain your main page content and grow to fill available space */}
      <div className="flex flex-grow flex-col">
        <SubHeader submenuText={submenuText} />
        <WeatherChartsWithAnimation region={region} charts={rainChartData} />
      </div>
      <RainfallLegendSection />
      <FooterControl charts={rainChartData} />
    </div>
  )
}
