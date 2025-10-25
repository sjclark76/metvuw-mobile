import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV !== 'production',
})

const nextConfig: NextConfig = {
  output: 'standalone', // This can help avoid some Vercel-specific optimizations
  webpack: (config, { dev, isServer }) => {
    // This modification is to prevent the development server from
    // watching the generated service worker files, which can cause infinite loops.
    if (dev && !isServer) {
      // Get existing ignored paths, defaulting to an empty array.
      const existingIgnored = config.watchOptions.ignored ?? []
      const ignoredAsArray = Array.isArray(existingIgnored)
        ? existingIgnored
        : [existingIgnored]

      // Filter out any invalid values to satisfy the Webpack schema.
      // This prevents errors from empty strings or non-string values.
      const validIgnoredPaths = ignoredAsArray.filter(
        (path) => typeof path === 'string' && path.length > 0,
      )

      // Create a new watchOptions object with the combined valid paths.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...validIgnoredPaths,
          '**/public/sw.js',
          '**/public/sw.js.map',
        ],
      }
    }
    return config
  },
  poweredByHeader: false,
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './src/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.metvuw.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
