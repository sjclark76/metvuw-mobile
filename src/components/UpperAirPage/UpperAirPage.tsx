import { useMemo } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { PageTopEnd } from '@/components/FooterControl/PageTopEnd'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import {
  BalloonLocationCode,
  balloonLocations,
} from '@/shared/types/balloonLocations'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'
import { UpperAirExplainer } from './UpperAirExplainer'

export function UpperAirPage({
  chartData,
  balloonCode,
}: {
  chartData: SkinnyChartData[]
  balloonCode: BalloonLocationCode
}) {
  // When each chart is for, so the footer can draw a time axis.
  const times = useMemo(
    () => chartData.map((chart) => chart.imageDateUTC),
    [chartData],
  )

  return (
    <ImageProgressProvider expected={expectedLoadedImages(chartData.length)}>
      <AnimationProvider
        count={chartData.length}
        times={times}
        intervalMs={1000}
      >
        {/* This outer div manages the layout for content and the sticky footer.
            It takes at least the height of the viewport minus the navbar (h-16). */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* This div contains the main page content and grows to fill space */}
          <div className="flex-grow">
            <SubHeader
              eyebrow="Upper air"
              title={balloonLocations[balloonCode]}
            />
            <UpperAirExplainer />
            <PageTopEnd />
            <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
          </div>
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
