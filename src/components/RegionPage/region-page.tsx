'use client'

import React from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { useInitShowAds } from '@/components/Atoms/AdState'
import { FooterControl } from '@/components/FooterControl'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import { RainfallLegendSection } from '@/components/RainfallLegend'
import SubHeader from '@/components/SubHeader'
import WeatherChartsWithAnimation from '@/components/WeatherCharts/WeatherChartsWithAnimation'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface RegionPageProps {
  region: Region
  rainChartData: SkinnyRainChartData[]
}

export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  const formatDate = useFormatDate()

  const submenuText =
    rainChartData.length > 0
      ? `Forecast issued at ${formatDate(
          rainChartData[0].imageDateUTC,
          'PPPPp',
        )} for ${region.name}`
      : ''

  useInitShowAds()

  return (
    // Only the eagerly loaded charts count towards the progress bar.
    <ImageProgressProvider
      expected={expectedLoadedImages(rainChartData.length)}
    >
      <AnimationProvider count={rainChartData.length} intervalMs={500}>
        {/* This outer div manages the layout for content and the sticky footer.
          It takes at least the height of the viewport minus the navbar (h-16). */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* This div contains the main page content and grows to fill space */}
          <div className="flex flex-grow flex-col">
            <SubHeader submenuText={submenuText} />
            <WeatherChartsWithAnimation
              region={region}
              charts={rainChartData}
            />
          </div>
          <RainfallLegendSection />
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
