/* eslint-disable no-console */

import Card from '@/components/Card'
import ChartCaption from '@/components/ChartCaption'
import { useFormatDate } from '@/components/Hooks/useFormatDate'
import WeatherImage from '@/components/WeatherImage'
import { SkinnyChartData } from '@/shared/types/chartData'
import { ChartType } from '@/shared/types/ChartType'

type Props = {
  image: SkinnyChartData
  chartType: Extract<ChartType, 'Radar' | 'Satellite' | 'Upper Air'>
  isHighPriority: boolean
  loading?: 'eager' | 'lazy'
}

type FormatDate = ReturnType<typeof useFormatDate>

const safeFormat = (
  formatDate: FormatDate,
  date: number,
  formatString: string,
) => {
  try {
    return formatDate(date, formatString)
  } catch {
    console.error(
      `error formatting date date:${date} formatString:${formatString}`,
    )
  }
}

function RadarAndSatelliteImageCard({
  image,
  chartType,
  isHighPriority,
  loading,
}: Props) {
  const formatDate = useFormatDate()

  const createImgAlt = (image: SkinnyChartData) => {
    return `${chartType.toLowerCase()} chart for ${formatDate(
      image.imageDateUTC,
      'PPPPp',
    )}`
  }

  return (
    <Card
      key={image.imageDateUTC}
      weatherImage={
        <WeatherImage
          imageSrc={image.url}
          imageAlt={createImgAlt(image)}
          chartType={chartType}
          isHighPriority={isHighPriority}
          loading={loading}
        />
      }
      caption={
        <ChartCaption
          day={safeFormat(formatDate, image.imageDateUTC, 'EEE')}
          time={safeFormat(formatDate, image.imageDateUTC, 'HH:mm')}
          date={safeFormat(
            formatDate,
            image.imageDateUTC,
            'dd MMM zzz',
          )?.toUpperCase()}
        />
      }
    />
  )
}

export { RadarAndSatelliteImageCard }
