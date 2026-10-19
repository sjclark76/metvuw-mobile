'use client'
import React, { useMemo } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function SatellitePage({
  satelliteData,
}: {
  satelliteData: SkinnyChartData[]
}) {
  // When each chart is for, so the footer can draw a time axis.
  const times = useMemo(
    () => satelliteData.map((chart) => chart.imageDateUTC),
    [satelliteData],
  )

  return (
    <ImageProgressProvider
      expected={expectedLoadedImages(satelliteData.length)}
    >
      <AnimationProvider
        count={satelliteData.length}
        times={times}
        intervalMs={1000}
      >
        {/* This outer div manages the layout for content and the sticky footer.
          It takes at least the height of the viewport minus the navbar (h-16). */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* This div contains the main page content and grows to fill space */}
          <div className="flex-grow">
            <SubHeader eyebrow="Satellite imagery" title="New Zealand" />
            <RadarAndSatelliteImages
              images={satelliteData}
              chartType="Satellite"
            />
          </div>
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
