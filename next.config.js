const withOffline = require('next-offline')

const securityHeaders = [
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
    value: "frame-ancestors 'none'",
  },
  {
    key: 'Content-Security-Policy',
    value:
      "script-src 'self'  'sha256-QYgGfxAvFb95Wfr8/J6nXSuhYgCzYgx3g/AeaN1F5J8=' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com; img-src 'self' data: https://*  *.metvuw.com",
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
]

const nextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/(.*)',
        headers: securityHeaders,
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
