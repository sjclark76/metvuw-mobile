'use client'
import Card from '@/components/Card'
import ChartCaption from '@/components/ChartCaption'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import { PinMarkers } from '@/components/Pins/PinMarkers'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { Region } from '@/shared/types/region'

import WeatherImage from '../WeatherImage/WeatherImage'

interface Props {
  chart: SkinnyRainChartData
  region: Region
  index: number
  loading?: 'eager' | 'lazy'
}

export function WeatherChart(props: Props) {
  const formatDate = useFormatDate()
  const forecastDate = new Date(props.chart.forecastDate)
  // How far ahead of the model run this chart is, as forecasters write it.
  const hoursAhead = Math.round(
    (forecastDate.getTime() - props.chart.imageDateUTC) / 36e5,
  )
  const leadTime =
    hoursAhead >= 0 ? `T+${String(hoursAhead).padStart(2, '0')}` : undefined
  const altTag = `${props.region.name} forecast chart for ${formatDate(
    forecastDate,
    'PPPPp',
  )}`

  return (
    <Card
      weatherImage={
        // The markers sit exactly on the image: it is a block as wide as this box.
        <div className="relative">
          <WeatherImage
            imageSrc={props.chart.url}
            imageAlt={altTag}
            chartType="Rain"
            isHighPriority={props.index === 0}
            loading={props.loading}
          />
          <PinMarkers region={props.region.code} />
        </div>
      }
      caption={
        <ChartCaption
          day={formatDate(forecastDate, 'EEE')}
          time={formatDate(forecastDate, 'HH:mm')}
          date={`${formatDate(forecastDate, 'dd MMM zzz')}`.toUpperCase()}
          lead={leadTime}
        />
      }
    />
  )
}
