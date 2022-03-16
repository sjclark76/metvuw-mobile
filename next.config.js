const { withOffline } = require('next-offline-ts')

const securityHeaders = function () {
  const headers = [
    {
      key: 'Cache-Control',
      value: 'max-age=31536000',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'Content-Security-Policy',
      value:
        "frame-ancestors 'none'; script-src 'self' 'sha256-QYgGfxAvFb95Wfr8/J6nXSuhYgCzYgx3g/AeaN1F5J8=' *.googletagmanager.com *.google-analytics.com; img-src 'self' data: https://*  *.metvuw.com",
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
  ]

  if (process.env.NODE_ENV !== 'production') {
    const index = headers.findIndex(
      (value) => value.key === 'Content-Security-Policy'
    )

    headers[index].value = headers[index].value.replace(
      "script-src 'self'",
      "script-src 'self' 'unsafe-eval'"
    )
  }
  return headers
}

const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: securityHeaders(),
      },
    ]
  },
  workboxOpts: {
    swDest: '../public/service-worker.js',
    runtimeCaching: [
      {
        urlPattern: /.gif.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxAgeSeconds: 12 * 60 * 60,
            maxEntries: 200,
          },
        },
      },
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 50,
          },
        },
      },
    ],
  },
  poweredByHeader: false,
  images: {
    domains: ['www.metvuw.com'],
  },
}

module.exports = withOffline(nextConfig)
