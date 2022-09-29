import { GetStaticPaths, GetStaticProps } from 'next'
import { config } from '../../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../../components/SeoMeta'
import {
  findRegionByCode,
  Region as RegionType,
  regions,
} from '../../shared/region'
import { RainChartData } from '../api/types/rainChartData'
import WeatherCharts from '../../components/WeatherCharts'
import { GetStaticPropsResult } from 'next/types'

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

export const getStaticPaths: GetStaticPaths = async () => {
  // Get the paths we want to pre-render based on posts
  const paths = regions.map((post) => ({
    params: { name: post.code },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { name } = context.params
  const apiURl = new URL(`api/charts/${name}`, config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()

  const matchedRegion = findRegionByCode(Array.isArray(name) ? name[0] : name)

  const meta = createSeoMetaProps(
    matchedRegion,
    charts[0].url,
    `regions/${charts.params}`
  )

  const result: GetStaticPropsResult<HomeProps> = {
    props: {
      region: matchedRegion,
      charts: charts,
      meta: meta,
    }, // will be passed to the page component as props
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 1800, // 30 minutes
  }

  return result
}
