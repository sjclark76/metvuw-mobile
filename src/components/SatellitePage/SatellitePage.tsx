'use client'
import React, { useMemo } from 'react'

import { ChartPage } from '@/components/ChartPage/ChartPage'
import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function SatellitePage({
  satelliteData,
}: {
  satelliteData: SkinnyChartData[]
}) {
  const times = useMemo(
    () => satelliteData.map((chart) => chart.imageDateUTC),
    [satelliteData],
  )

  return (
    <ChartPage
      times={times}
      intervalMs={1000}
      header={<SubHeader eyebrow="Satellite imagery" title="New Zealand" />}
    >
      <RadarAndSatelliteImages images={satelliteData} chartType="Satellite" />
    </ChartPage>
  )
}
