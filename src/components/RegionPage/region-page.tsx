'use client'

import WeatherCharts from '@/components/WeatherCharts'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface RegionPageProps {
  region: Region
  rainChartData: SkinnyRainChartData[]
}
export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  return <WeatherCharts region={region} charts={rainChartData} />
}
