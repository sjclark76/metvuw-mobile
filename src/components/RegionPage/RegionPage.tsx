'use client'

import React, { useMemo } from 'react'

import { useInitShowAds } from '@/components/Atoms/AdState'
import { ChartPage } from '@/components/ChartPage/ChartPage'
import { FooterControl } from '@/components/FooterControl'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { RainfallLegendSection } from '@/components/RainfallLegend'
import { HeavyRainSlot } from '@/components/RainStrip/HeavyRainNote'
import { RainWatchProvider } from '@/components/RainStrip/RainWatch'
import SubHeader from '@/components/SubHeader'
import WeatherChartsWithAnimation from '@/components/WeatherCharts/WeatherChartsWithAnimation'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface RegionPageProps {
  region: Region
  rainChartData: SkinnyRainChartData[]
}

export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  const formatDate = useFormatDate()

  const issued =
    rainChartData.length > 0
      ? `Issued ${formatDate(rainChartData[0].imageDateUTC, 'EEE d MMMM, h:mmaaa')}`
      : undefined

  useInitShowAds()

  const times = useMemo(
    () => rainChartData.map((chart) => new Date(chart.forecastDate).getTime()),
    [rainChartData],
  )

  const chartUrls = useMemo(
    () => rainChartData.map((chart) => chart.url),
    [rainChartData],
  )

  return (
    <ChartPage
      times={times}
      intervalMs={500}
      header={
        <>
          <SubHeader
            eyebrow="Rain and wind forecast"
            title={region.name}
            detail={issued}
          />
          <HeavyRainSlot />
        </>
      }
      legend={<RainfallLegendSection />}
      footer={<FooterControl rain={{ region: region.code, chartUrls }} />}
      within={(layout) => (
        <RainWatchProvider region={region.code} chartUrls={chartUrls}>
          {layout}
        </RainWatchProvider>
      )}
    >
      <WeatherChartsWithAnimation region={region} charts={rainChartData} />
    </ChartPage>
  )
}
