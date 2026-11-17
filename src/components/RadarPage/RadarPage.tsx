import { useMemo } from 'react'

import { ChartPage } from '@/components/ChartPage/ChartPage'
import { RadarKeySection } from '@/components/RadarKey'
import SubHeader from '@/components/SubHeader'
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
  const times = useMemo(
    () => radarData.map((chart) => chart.imageDateUTC),
    [radarData],
  )

  return (
    <ChartPage
      times={times}
      intervalMs={1000}
      header={<SubHeader eyebrow="Radar" title={radarRegions[radarCode]} />}
      legend={<RadarKeySection />}
    >
      <RadarAndSatelliteImages images={radarData} chartType="Radar" />
    </ChartPage>
  )
}
