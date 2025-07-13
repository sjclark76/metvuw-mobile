import { Metadata } from 'next'

import { config } from '@/config'

export default function generateSEOMetadata({
  title,
  description,
  url,
}: {
  description: string
  title: string
  url: string
}): Metadata {
  return {
    alternates: {
      canonical: url,
    },
    description,
    icons: [
      { rel: 'apple-touch-icon', sizes: '57x57', url: '/apple-icon-57x57.png' },
      { rel: 'apple-touch-icon', sizes: '60x60', url: '/apple-icon-60x60.png' },
      {
        rel: 'apple-touch-icon',
        sizes: '60x60',
        url: '/apple-icon-60x60.png',
      },
      { rel: 'apple-touch-icon', sizes: '72x72', url: '/apple-icon-72x72.png' },
      { rel: 'apple-touch-icon', sizes: '76x76', url: '/apple-icon-76x76.png' },
      {
        rel: 'apple-touch-icon',
        sizes: '114x114',
        url: '/apple-icon-114x114.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '120x120',
        url: '/apple-icon-120x120.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '144x144',
        url: '/apple-icon-144x144.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '152x152',
        url: '/apple-icon-152x152.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        url: '/apple-icon-180x180.png',
      },
      {
        rel: 'icon',
        sizes: '192x192',
        type: 'image/png',
        url: '/android-icon-192x192.png',
      },
      {
        rel: 'icon',
        sizes: '32x32',
        type: 'image/png',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        sizes: '96x96',
        type: 'image/png',
        url: '/favicon-96x96.png',
      },
      {
        rel: 'icon',
        sizes: '16x16',
        type: 'image/png',
        url: '/favicon-16x16.png',
      },
    ],
    manifest: '/manifest.json',
    metadataBase: new URL(config.baseUrl),
    appleWebApp: {
      capable: true,
      title: 'Metvuw Mobile',
      statusBarStyle: 'default',
      startupImage: [
        {
          url: '/placeholder.png',
          media:
            '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
        },
        {
          url: '/placeholder.png',
          media:
            '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
        },
      ],
    },
    openGraph: {
      description,
      siteName: 'Metvuw Mobile',
      title,
      type: 'website',
      url,
    },
    title,
  }
}
