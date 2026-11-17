import { useMemo } from 'react'

import { ChartPage } from '@/components/ChartPage/ChartPage'
import SubHeader from '@/components/SubHeader'
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
    <ChartPage times={times} intervalMs={1000} header={header}>
      <RadarAndSatelliteImages images={chartData} chartType="Upper Air" />
    </ChartPage>
  )
}
