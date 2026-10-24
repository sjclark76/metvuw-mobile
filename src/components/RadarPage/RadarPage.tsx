import { useMemo } from 'react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import { PageTopEnd } from '@/components/FooterControl/PageTopEnd'
import { ImageProgressProvider } from '@/components/ImageProgress/ImageProgress'
import { RadarKeySection } from '@/components/RadarKey'
import SubHeader from '@/components/SubHeader'
import { expectedLoadedImages } from '@/shared/helpers/imageLoading'
import { SkinnyChartData } from '@/shared/types/chartData'
import { RadarCode, radarRegions } from '@/shared/types/radarRegions'

import RadarAndSatelliteImages from '../RadarAndSatelliteImages/RadarAndSatelliteImages'

export function RadarPage({
  radarData,
  radarCode,
}: {
  radarData: SkinnyChartData[]
  radarCode: RadarCode
}) {
  // When each chart is for, so the footer can draw a time axis.
  const times = useMemo(
    () => radarData.map((chart) => chart.imageDateUTC),
    [radarData],
  )

  return (
    <ImageProgressProvider expected={expectedLoadedImages(radarData.length)}>
      <AnimationProvider
        count={radarData.length}
        times={times}
        intervalMs={1000}
      >
        {/* This outer div manages the layout for content and the sticky footer.
            It takes at least the height of the viewport minus the navbar (h-16). */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          {/* This div contains the main page content and grows to fill space */}
          <div className="flex-grow">
            <SubHeader eyebrow="Radar" title={radarRegions[radarCode]} />
            <PageTopEnd />
            <RadarAndSatelliteImages images={radarData} chartType="Radar" />
          </div>
          <RadarKeySection />
          <FooterControl />
        </div>
      </AnimationProvider>
    </ImageProgressProvider>
  )
}
