'use client'
import React, { useState } from 'react'

import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/animated-weather-chart'
import { Toggle } from '@/components/Toggle'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'
interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}
const WeatherCharts = (props: WeatherChartsProps) => {
  const [displayVideo, setDisplayVideo] = useState(false)
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 pt-2">
        <Toggle onChange={setDisplayVideo} isSelected={displayVideo}>
          Animate map
        </Toggle>
        {displayVideo ? (
          <ul className="flex h-full w-full flex-col items-center">
            <AnimatedWeatherChart region={props.region} charts={props.charts} />
          </ul>
        ) : (
          <ul className="flex flex-col items-center">
            {props.charts.map((chart, index) => (
              <WeatherChart
                key={chart.forecastDate}
                chart={chart}
                region={props.region}
                index={index}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default WeatherCharts
