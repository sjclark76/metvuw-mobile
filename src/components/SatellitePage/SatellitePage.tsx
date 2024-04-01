'use client'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages'
import SubHeader from '@/components/SubHeader'
import { SkinnyChartData } from '@/shared/helpers/v2/chartData/constructChartData'

export function SatellitePage({
  satelliteData,
}: {
  satelliteData: SkinnyChartData[]
}) {
  return (
    <>
      <SubHeader submenuText="Satellite Imagery for New Zealand" />
      <RadarAndSatelliteImages images={satelliteData} chartType="Satellite" />
    </>
  )
}
