import { ChartResponse } from './api/charts/[region]'
import { GetServerSideProps } from 'next'
import { config } from '../config'
import { useEffect, useState } from 'react'
import Image from 'next/image'
interface HomeProps {
  charts: ChartResponse[]
}
const fadeOutCss =
  'transition-opacity duration-1000 ease-out opacity-100 hover:opacity-0'

const fadeInCss = ' ease-in opacity-0 opacity-100'
export default function Animation(props: HomeProps) {
  const [activeChartIndex, setActiveChartIndex] = useState(0)
  let fadeIn = true
  let fadeOut = false

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex =
        activeChartIndex === props.charts.length - 1 ? 0 : activeChartIndex + 1
      setActiveChartIndex(nextIndex)
    }, 2000)

    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer)
  })
  return (
    <div className="pt-2  ">
      <div className="flex justify-center py-3 filter drop-shadow-2xl ">
        <div>
          <Image
            src={props.charts[activeChartIndex].url}
            alt="SET ME"
            layout="intrinsic"
            objectFit="cover"
            objectPosition="0% 70%"
            width={711}
            height={492}
          />
        </div>
      </div>
    </div>
  )
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
