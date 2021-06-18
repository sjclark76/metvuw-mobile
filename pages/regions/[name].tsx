import { ChartResponse } from '../api/charts/[region]'
import { DisplayCharts } from '../../components/DisplayCharts'
import { GetServerSideProps } from 'next'
import { config } from '../../config'
import {
  createSeoMetaProps,
  SeoMeta,
  SeoMetaProps,
} from '../../components/SeoMeta'
import { regions } from '../../shared/region'

interface HomeProps {
  charts: ChartResponse[]
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
      <DisplayCharts charts={props.charts} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { name } = context.params
  const apiURl = new URL(`api/charts/${name}`, config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()

  const matchedRegion = regions.find((value) => value.code === name)

  const meta = createSeoMetaProps(matchedRegion, charts[0].url, context)

  return {
    props: {
      charts: charts,
      meta: meta,
    }, // will be passed to the page component as props
  }
}
