import { GetServerSideProps } from 'next'
import { config } from '../../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../../components/SeoMeta'
import { getByRegionCode, Region as RegionType } from '../../shared/region'
import { RainChartData } from '../api/types/rainChartData'
import WeatherCharts from '../../components/WeatherCharts'
import { buildKeyName, downloadRainChartData } from '../api/helpers/s3Helper'
import { ParsedUrlQuery } from 'querystring'
import { GetServerSidePropsResult } from 'next/types'

interface HomeProps {
  region: RegionType
  charts: RainChartData[]
  meta: SeoMetaProps
}

interface Params extends ParsedUrlQuery {
  name: string
}
export default function Region(props: HomeProps) {
  return (
    <div>
      <SeoMeta
        title={props.meta.title}
        desc={props.meta.desc}
        imageUrl={props.meta.imageUrl}
        url={props.meta.url}
      />
      <WeatherCharts charts={props.charts} region={props.region} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<HomeProps, Params> = async (
  context,
) => {
  const name = context.params?.name

  const regionName = name ?? 'nz'

  const matchedRegion = getByRegionCode(
    Array.isArray(regionName) ? regionName[0] : regionName,
  )

  const chartDataPromise = downloadRainChartData({
    Bucket: config.s3.bucketName,
    Key: buildKeyName(regionName),
  })

  const serverSideProps: GetServerSidePropsResult<HomeProps> = {
    props: chartDataPromise.then((chartData) => {
      return {
        charts: chartData,
        region: matchedRegion,
        meta: createSeoMetaProps(
          matchedRegion,
          chartData[0].url ?? '',
          `regions/${regionName}`,
        ),
      }
    }),
  }

  return serverSideProps
}
