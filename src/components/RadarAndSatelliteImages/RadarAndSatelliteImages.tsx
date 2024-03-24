'use client'
import { ChartType } from '@shared/ChartType'
import { ChartData } from '@shared/types/chartData'
import { format } from 'date-fns'
import { useSetAtom } from 'jotai'

import { submenuTextAtom } from '@/components/Atoms/GlobalState'
import Card from '@/components/Card'
import WeatherImage from '@/components/WeatherImage'

interface Props {
  images: ChartData[]
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
  headerText: string
}

export function RadarAndSatelliteImages({
  images,
  chartType,
  headerText,
}: Props) {
  const setSubmenuText = useSetAtom(submenuTextAtom)

  setSubmenuText(headerText)

  const createImgAlt = (image: ChartData) => {
    return `${chartType.toLowerCase()} chart for ${format(
      new Date(image.imageDateUTC),
      'PPPPp',
    )}`
  }

  return (
    <ul className="flex flex-col items-center">
      {images.map((image) => (
        <Card
          key={image.imageDateUTC}
          weatherImage={
            <WeatherImage
              imageSrc={image.url}
              imageAlt={createImgAlt(image)}
              chartType={chartType}
            />
          }
          date={
            <span className="text-base font-semibold text-gray-700">
              {format(image.imageDateUTC, 'PPPP')}
            </span>
          }
          time={
            <span className="w-20 transform rounded bg-gray-900 px-2 py-1 text-center text-xs font-semibold uppercase text-white transition-colors duration-200 hover:bg-gray-200 focus:bg-gray-400 focus:outline-none">
              {format(image.imageDateUTC, 'hh:mm a')}
            </span>
          }
        />
      ))}
    </ul>
  )
}
