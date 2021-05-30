import { ChartResponse } from '../api/charts/[region]'
import { DisplayCharts } from '../../components/DisplayCharts'
import { GetServerSideProps } from 'next'
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
  const response = await fetch(`http://localhost:3000/api/charts/${name}`)
  const charts = await response.json()
  return {
    props: {
      charts: charts,
    }, // will be passed to the page component as props
  }
}
