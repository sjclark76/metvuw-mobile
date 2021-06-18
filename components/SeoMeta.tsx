import Head from 'next/head'
import { GetServerSidePropsContext } from 'next'
import { config } from '../config'
import { Region } from '../shared/region'

export interface SeoMetaProps {
  title: string
  desc: string
  url: string
  imageUrl: string
}

export const createSeoMetaProps = (
  region: Region,
  imageUrl: string,
  context: GetServerSidePropsContext
): SeoMetaProps => {
  return {
    title: `metvuwmobile | ${region.name}`,
    desc: `forecast for ${region.name}`,
    imageUrl: imageUrl,
    url: new URL(context.resolvedUrl, config.baseUrl).href,
  }
}

export const SeoMeta = (props: SeoMetaProps) => {
  return (
    <Head>
      <title>{props.title}</title>
      <meta name="description" content={props.desc} />
      <meta property="og:type" content="website" />
      <meta name="og:title" property="og:title" content={props.title} />
      <meta
        name="og:description"
        property="og:description"
        content={props.desc}
      />
      <meta property="og:site_name" content="Metvuw Mobile" />
      <meta property="og:url" content={props.url} />
      <link rel="icon" type="image/png" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/favicon.ico" />
      <meta property="og:image" content={props.imageUrl} />
      <link rel="canonical" href="" />
    </Head>
  )
}
