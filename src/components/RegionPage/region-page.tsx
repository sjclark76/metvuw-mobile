'use client'

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
  return (
    <>
      <SubHeader />
      <WeatherCharts region={region} charts={rainChartData} />
    </>
  )
}
