'use client'
import React, { useCallback, useState } from 'react'

import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/animated-weather-chart'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'
import { atom, useSetAtom } from 'jotai'
interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}
export const isWeatherChartAnimatedAtom = atom(false)

const WeatherCharts = (props: WeatherChartsProps) => {
  const [displayVideo, setDisplayVideo] = useState(false)
  const setIsWeatherChartAnimated = useSetAtom(isWeatherChartAnimatedAtom)
  const handleMasterPlay = useCallback(() => {
    displayVideo
      ? setIsWeatherChartAnimated(false)
      : setIsWeatherChartAnimated(true)
    setDisplayVideo((prevState) => !prevState)
  }, [])
  return (
    <>
      <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-2 pt-2">
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

        <button
          onClick={handleMasterPlay}
          className="fixed bottom-4 left-4 z-20 transform rounded-full bg-purple-600 p-4 text-white shadow-lg transition-all hover:scale-110 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
          aria-label="Toggle Action"
        >
          {displayVideo ? (
            // X Icon
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Updated Play Icon (Solid Arrow)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z"></path>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}

export default WeatherCharts
