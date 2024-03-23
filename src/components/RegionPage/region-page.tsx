'use client'

import { RainChartData } from '../../../pages/api/types/rainChartData'
import WeatherCharts from '@/components/WeatherCharts'
import { Region } from '@shared/region'

interface RegionPageProps {
  region: Region
  rainChartData: RainChartData[]
}
export default function RegionPage({ region, rainChartData }: RegionPageProps) {
  return <WeatherCharts region={region} charts={rainChartData} />
}
