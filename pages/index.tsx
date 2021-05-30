import { DisplayCharts } from '../components/DisplayCharts'
import { ChartResponse } from './api/charts/[region]'
import { GetServerSideProps } from 'next'
import { config } from '../config'
interface HomeProps {
  charts: ChartResponse[]
}
export default function Home(props: HomeProps) {
  return <DisplayCharts charts={props.charts} />
}

export const getServerSideProps: GetServerSideProps = async () => {
  const apiURl = new URL('api/charts/nz', config.baseUrl)
  const response = await fetch(apiURl.href)
  const charts = await response.json()
  return {
    props: {
      charts: charts,
    }, // will be passed to the page component as props
  }
}
