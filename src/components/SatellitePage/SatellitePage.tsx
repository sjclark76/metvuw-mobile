'use client'
import React from 'react'

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
  return (
    <ImageProgressProvider
      expected={expectedLoadedImages(satelliteData.length)}
    >
      <AnimationProvider count={satelliteData.length} intervalMs={1000}>
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
