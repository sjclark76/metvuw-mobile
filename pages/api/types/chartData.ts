export interface ChartData {
  url: string
  year: number
  month: number
  day: number
  hour: number
  width: number
  height: number
}
// satellite date ./small/202205161200.jpg
export interface RainChartData {
  utcDate?: number
  issueDate?: string
  forecastDate?: string
  offset?: number
}

export interface SatelliteChartData {
  imageDate?: number
  imageDateIso?: string
  offset?: number
}
