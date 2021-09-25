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

export const createGeneralSeoMetaProps = (
  message: string,
  imageUrl: string,
  context: GetServerSidePropsContext
): SeoMetaProps => {
  return {
    title: `metvuw mobile | ${message}`,
    desc: `${message} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
    imageUrl: imageUrl,
    url: new URL(context.resolvedUrl, config.baseUrl).href,
  }
}

export const createSeoMetaProps = (
  region: Region,
  imageUrl: string,
  context: GetServerSidePropsContext
): SeoMetaProps => {
  return {
    title: `metvuw mobile | ${region.name}`,
    desc: `${region.name} wind & rain forecast charts. Optimized for mobile devices. Sourced from metvuw.com`,
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
      <meta property="og:image" content={props.imageUrl} />
      <link rel="canonical" href={props.url} />

      <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
      <link
        rel="apple-touch-icon"
        sizes="114x114"
        href="/apple-icon-114x114.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="120x120"
        href="/apple-icon-120x120.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="144x144"
        href="/apple-icon-144x144.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="152x152"
        href="/apple-icon-152x152.png"
      />
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-icon-180x180.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="192x192"
        href="/android-icon-192x192.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="96x96"
        href="/favicon-96x96.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/manifest.json" />
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
      <meta name="theme-color" content="#ffffff" />
    </Head>
  )
}
