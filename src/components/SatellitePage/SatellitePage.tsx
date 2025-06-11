'use client'
import React from 'react'

import { FooterControl } from '@/components/FooterControl'
import { usePreloadedImages } from '@/components/Hooks/usePreloadedImages'
import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function SatellitePage({
  satelliteData,
}: {
  satelliteData: SkinnyChartData[]
}) {
  usePreloadedImages(satelliteData)

  return (
    // This outer div will manage the layout for content and the sticky footer.
    // It takes at least the height of the viewport minus the main navbar's height (approx. 4rem or h-16).
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* This div will contain your main page content and grow to fill available space */}
      <div className="flex-grow">
        <SubHeader submenuText="Satellite Imagery for New Zealand" />
        <RadarAndSatelliteImages images={satelliteData} chartType="Satellite" />
      </div>
      <FooterControl charts={satelliteData} />
    </div>
  )
}
