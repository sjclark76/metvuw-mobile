import { GetServerSideProps } from 'next'
import { config } from '../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../components/SeoMeta'
import { findRegionByCode, Region } from '../shared/region'
import { RainChartData } from './api/rainChartData'
import WeatherCharts from '../components/WeatherCharts'
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const apiURl = new URL('api/charts/nz', config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()

  const matchedRegion = findRegionByCode('nz')

  const meta: SeoMetaProps = createSeoMetaProps(
    matchedRegion,
    charts[0].url,
    context
  )
  return {
    props: {
      region: matchedRegion,
      charts: charts,
      meta: meta,
    },
  }
}
