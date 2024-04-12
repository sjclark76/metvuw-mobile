/**
 * This is a Checkly CLI ApiCheck construct. To learn more, visit:
 * - https://www.checklyhq.com/docs/cli/
 * - https://www.checklyhq.com/docs/cli/constructs-reference/#apicheck
 */

import { ApiCheck, Frequency, RetryStrategyBuilder } from 'checkly/constructs'

const endpoints = ['satellite', 'radar', 'upper-air']
for (const endpoint of endpoints) {
  new ApiCheck(`scrape-${endpoint}`, {
    name: `Scrape ${endpoint}`,
    activated: false,
    muted: false,
    shouldFail: false,
    runParallel: false,
    locations: [],
    tags: [],
    frequency: Frequency.EVERY_6H,
    environmentVariables: [],
    // group: your check belongs to group 'Update Cache',
    maxResponseTime: 20000,
    degradedResponseTime: 5000,
    request: {
      url: `https://metvuwmobile.com/api/scrape/${endpoint}`,
      method: 'GET',
      followRedirects: true,
      skipSSL: false,
      assertions: [],
      body: ``,
      bodyType: 'NONE',
      headers: [],
      queryParameters: [],
      basicAuth: {
        username: '',
        password: '',
      },
    },
    retryStrategy: RetryStrategyBuilder.fixedStrategy({
      baseBackoffSeconds: 0,
      maxRetries: 1,
      maxDurationSeconds: 600,
      sameRegion: false,
    }),
  })
}
