'use client'

import { format } from 'date-fns'
import React from 'react'

import SubHeader from '@/components/SubHeader'
import WeatherCharts from '@/components/WeatherCharts'
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

  return (
    <>
      <SubHeader submenuText={submenuText} />
      <WeatherCharts region={region} charts={rainChartData} />
    </>
  )
}
