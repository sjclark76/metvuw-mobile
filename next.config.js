const withOffline = require('next-offline')

const nextConfig = {
  /* config options here */
  workboxOpts: {
    swDest: '../public/service-worker.js',
  },

  poweredByHeader: false,
  images: {
    domains: ['www.metvuw.com', 'dpucyvo9dklo9.cloudfront.net'],
  },
}

module.exports = withOffline(nextConfig)
