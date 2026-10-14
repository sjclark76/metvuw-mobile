'use client'
import { useEffect } from 'react'

import { preloadImage } from '@/shared/helpers/images'
import { SkinnyChartData } from '@/shared/types/chartData'

function usePreloadedImages(imageData: SkinnyChartData[]) {
  useEffect(() => {
    if (imageData && imageData.length > 0) {
      imageData.forEach((chart) => {
        if (chart.url) {
          preloadImage(chart.url)
        }
      })
    }
  }, [imageData])
}

export { usePreloadedImages }
