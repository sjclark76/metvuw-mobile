import { ChartResponse } from '../api/charts/[region]'
import { DisplayCharts } from '../../components/DisplayCharts'
import { GetServerSideProps } from 'next'
import { config } from '../../config'
interface HomeProps {
  charts: ChartResponse[]
}
export default function Region(props: HomeProps) {
  return (
    <div>
      <DisplayCharts charts={props.charts} />
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { name } = context.params
  const apiURl = new URL(`api/charts/${name}`, config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()
  return {
    props: {
      charts: charts,
    }, // will be passed to the page component as props
  }
}
