import { randomUUID } from 'node:crypto'

import withSerwistInit from '@serwist/next'
import type { NextConfig } from 'next'

import { securityHeaders } from './src/securityHeaders'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // UpdateNotification registers the worker, so it can offer a reload when a new
  // version is waiting.
  register: false,
  // The default reloads the page whenever connectivity returns, which loses
  // whatever the visitor was doing, such as the animation they were watching.
  reloadOnOnline: false,
  // The offline page is not part of the build manifest. A fresh revision per
  // deploy re-caches it, so it never goes stale.
  additionalPrecacheEntries: [
    {
      url: '/offline',
      revision: process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID(),
    },
  ],
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
  turbopack: {},
  poweredByHeader: false,
  // The home page lives at /home/nz (see src/app/home/[region]/page.tsx), so it is
  // rendered on its first visit and not at build time. The address stays /.
  async rewrites() {
    return [{ source: '/', destination: '/home/nz' }]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    unoptimized: true,
    domains: [],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default withSerwist(nextConfig)
