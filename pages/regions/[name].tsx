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
import { buildKeyName, s3download } from '../api/helpers/s3Helper'

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

export const getStaticProps: GetStaticProps = async (context) => {
  let { name: region } = context.params

  if (!region) region = 'nz'

  const regionName = Array.isArray(region) ? region[0] : region
  const chartData = await s3download({
    Bucket: config.s3.bucketName,
    Key: buildKeyName(regionName),
  })

  const matchedRegion = findRegionByCode(
    Array.isArray(regionName) ? regionName[0] : regionName
  )

  const meta = createSeoMetaProps(
    matchedRegion,
    chartData[0].url,
    `regions/${regionName}`
  )

  return {
    props: {
      region: matchedRegion,
      charts: chartData,
      meta: meta,
    }, // will be passed to the page component as props
  }
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export const getStaticPaths: GetStaticPaths = async () => {
  // Get the paths we want to pre-render based on posts
  const paths = regions.map((region) => ({
    params: { name: region.code },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: blocking } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}
