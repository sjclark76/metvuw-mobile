'use client'
import { useAtomValue } from 'jotai'
import React from 'react'

import { AdCard } from '@/components/AdCard'
import { AnimatedWeatherChart } from '@/components/AnimatedWeatherChart/AnimatedWeatherChart'
import { useAnimation } from '@/components/Animation/Animation'
import { showAdsAtom } from '@/components/Atoms/AdState'
import { usePresence } from '@/components/Hooks/usePresence'
import { fadeInProps } from '@/shared/helpers/fadeIn'
import { chartAspectRatio } from '@/shared/helpers/imageCompression/imageDimensions'
import { imageLoadingFor } from '@/shared/helpers/imageLoading'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import { WeatherChart } from './WeatherChart'

interface WeatherChartsProps {
  region: Region
  charts: SkinnyRainChartData[]
}

// As long as the viewer's fade out (animate-fade-out in globals.css).
const VIEWER_EXIT_MS = 300

const AD_POSITION = 2

const WeatherChartsWithAnimation = (props: WeatherChartsProps) => {
  const { displayAnimated: displayAnimatedChart } = useAnimation()
  const showAds = useAtomValue(showAdsAtom)
  // The viewer fades in; going back, it fades out before the list comes back.
  const viewer = usePresence(displayAnimatedChart, VIEWER_EXIT_MS)
  return (
    <>
      <div className="relative flex h-full flex-1 flex-col gap-2">
        {viewer !== 'gone' ? (
          <div
            className={`mx-auto flex w-full max-w-176 flex-grow flex-col items-center justify-center ${viewer === 'shown' ? 'animate-fade-in' : 'animate-fade-out'}`}
          >
            <AnimatedWeatherChart region={props.region} charts={props.charts} />
          </div>
        ) : (
          <ul
            key="static-list"
            className="mx-auto flex w-full max-w-176 flex-col items-center pt-2"
          >
            {props.charts.map((chart, index) => (
              <React.Fragment key={chart.forecastDate}>
                {showAds && index === AD_POSITION && (
                  <li key="ad-card" className="w-full">
                    <AdCard />
                  </li>
                )}
                <li
                  {...fadeInProps(
                    index,
                    'w-full scroll-mt-20',
                    chartAspectRatio('Rain'),
                  )}
                  data-chart-index={index}
                >
                  <WeatherChart
                    chart={chart}
                    region={props.region}
                    index={index}
                    loading={imageLoadingFor(index)}
                  />
                </li>
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default WeatherChartsWithAnimation
