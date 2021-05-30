import { DisplayCharts } from '../components/DisplayCharts'
import { ChartResponse } from './api/charts/[region]'
import { GetServerSideProps } from 'next'
interface HomeProps {
  charts: ChartResponse[]
}
export default function Home(props: HomeProps) {
  return <DisplayCharts charts={props.charts} />
}

export const getServerSideProps: GetServerSideProps = async () => {
  const response = await fetch('http://localhost:3000/api/charts/nz')
  const charts = await response.json()
  return {
    props: {
      charts: charts,
    }, // will be passed to the page component as props
  }
}
