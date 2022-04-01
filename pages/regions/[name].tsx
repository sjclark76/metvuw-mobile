import { GetServerSideProps } from 'next'
import { config } from '../../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../../components/SeoMeta'
import { findRegionByCode, Region as RegionType } from '../../shared/region'
import { RainChartData } from '../api/rainChartData'
import WeatherCharts from '../../components/WeatherCharts'

interface HomeProps {
  region: RegionType
  charts: RainChartData[]
  meta: SeoMetaProps
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { name } = context.params
  const apiURl = new URL(`api/charts/${name}`, config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()

  const matchedRegion = findRegionByCode(Array.isArray(name) ? name[0] : name)

  const meta = createSeoMetaProps(matchedRegion, charts[0].url, context)

  return {
    props: {
      region: matchedRegion,
      charts: charts,
      meta: meta,
    }, // will be passed to the page component as props
  }
}
