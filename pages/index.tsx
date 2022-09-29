import { GetStaticProps } from 'next'
import { config } from '../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../components/SeoMeta'
import { findRegionByCode, Region } from '../shared/region'
import { RainChartData } from './api/types/rainChartData'
import WeatherCharts from '../components/WeatherCharts'
import { GetStaticPropsResult } from 'next/types'
interface HomeProps {
  region: Region
  charts: RainChartData[]
  meta: SeoMetaProps
}
export default function Home(props: HomeProps) {
  return (
    <>
      <SeoMeta
        title={props.meta.title}
        desc={props.meta.desc}
        url={props.meta.url}
        imageUrl={props.meta.imageUrl}
      />
      <WeatherCharts charts={props.charts} region={props.region} />
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const apiURl = new URL('api/charts/nz', config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()

  const matchedRegion = findRegionByCode('nz')

  const meta: SeoMetaProps = createSeoMetaProps(
    matchedRegion,
    charts[0].url,
    '/'
  )
  const result: GetStaticPropsResult<HomeProps> = {
    props: {
      region: matchedRegion,
      charts: charts,
      meta: meta,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 1800, // 30 minutes
  }

  return result
}
