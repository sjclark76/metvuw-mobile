const withOffline = require('next-offline')

const nextConfig = {
  /* config options here */
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
