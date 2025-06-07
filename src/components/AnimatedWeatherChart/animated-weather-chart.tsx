'use client'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'

import { WeatherChart } from '@/components/WeatherCharts/WeatherChart'
import { isWeatherChartAnimatedAtom } from '@/components/WeatherCharts/WeatherCharts'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

interface AnimatedWeatherChartProps {
  region: Region
  charts: SkinnyRainChartData[]
}
const AnimatedWeatherChart = ({
  region,
  charts,
}: AnimatedWeatherChartProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isWeatherChartAnimated, setIsWeatherChartAnimated] = useAtom(
    isWeatherChartAnimatedAtom,
  )

  useEffect(() => {
    let interval
    if (isWeatherChartAnimated) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % charts.length)
      }, 250)
    }
    return () => clearInterval(interval)
  }, [isWeatherChartAnimated, charts.length])

  const handleProgressChange = (e) => {
    setCurrentIndex(Number(e.target.value))
  }

  return (
    <div>
      <WeatherChart
        region={region}
        chart={charts[currentIndex]}
        index={currentIndex}
      />

      <div className="mt-5 flex items-center px-4">
        <button
          onClick={() => setIsWeatherChartAnimated((prev) => !prev)}
          className="mr-4 text-black"
        >
          {isWeatherChartAnimated ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-12 text-slate-500"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM9 8.25a.75.75 0 0 0-.75.75v6c0 .414.336.75.75.75h.75a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75H9Zm5.25 0a.75.75 0 0 0-.75.75v6c0 .414.336.75.75.75H15a.75.75 0 0 0 .75-.75V9a.75.75 0 0 0-.75-.75h-.75Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-12 text-slate-500"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <input
          type="range"
          min="0"
          max={charts.length - 1}
          value={currentIndex}
          onChange={handleProgressChange}
          className="w-full accent-slate-500"
        />
      </div>
    </div>
  )
}
export { AnimatedWeatherChart }
