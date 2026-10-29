import { useMemo } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { PageTopEnd } from '@/components/FooterControl/PageTopEnd'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import type { FetchedSounding } from '@/shared/helpers/sounding/fetchSounding'
import { showOwnChart } from '@/shared/helpers/sounding/showOwnChart'
import { summariseSounding } from '@/shared/helpers/sounding/summariseSounding'
import {
  BalloonLocationCode,
  balloonLocations,
} from '@/shared/types/balloonLocations'
import { SkinnyChartData } from '@/shared/types/chartData'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'
import { SoundingChart } from './SoundingChart'
import { SoundingGlance } from './SoundingGlance'
import { UpperAirExplainer } from './UpperAirExplainer'

export function UpperAirPage({
  chartData,
  balloonCode,
  sounding,
}: {
  chartData: SkinnyChartData[]
  balloonCode: BalloonLocationCode
  /** The latest balloon with data, from the University of Wyoming, if any. */
  sounding?: FetchedSounding
}) {
  // When each chart is for, so the footer can draw a time axis.
  const times = useMemo(
    () => chartData.map((chart) => chart.imageDateUTC),
    [chartData],
  )
  const summary = sounding && summariseSounding(sounding.sounding)
  const header = (
    <>
      <SubHeader eyebrow="Upper air" title={balloonLocations[balloonCode]} />
      {sounding && summary && (
        <SoundingGlance
          summary={summary}
          launchUTC={sounding.launchUTC}
          sourceUrl={sounding.sourceUrl}
        />
      )}
      <UpperAirExplainer />
    </>
  )

  // Our chart replaces metvuw's when metvuw has nothing as recent. There is no
  // footer then: its time axis and viewer step through metvuw's series.
  if (sounding && summary && showOwnChart(times, sounding.launchUTC)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] pb-8">
        {header}
        <SoundingChart
          sounding={sounding.sounding}
          summary={summary}
          launchUTC={sounding.launchUTC}
          sourceUrl={sounding.sourceUrl}
          metvuwNewestUTC={times.length > 0 ? Math.max(...times) : undefined}
        />
      </div>
    )
  }

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
            {header}
            <PageTopEnd />
            <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
          </div>
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
