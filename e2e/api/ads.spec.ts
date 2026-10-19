import { expect, test } from '@playwright/test'

const cookiesFor = async (
  request: import('@playwright/test').APIRequestContext,
  country: string,
  cookie?: string,
) => {
  const response = await request.get('/satellite', {
    headers: {
      'x-vercel-ip-country': country,
      ...(cookie ? { cookie } : {}),
    },
  })
  return response
    .headersArray()
    .filter(({ name }) => name.toLowerCase() === 'set-cookie')
    .map(({ value }) => value.split(';')[0])
}

test.describe('ad cookies', () => {
  test('New Zealand visitors are not shown ads', async ({ request }) => {
    expect(await cookiesFor(request, 'NZ')).toEqual([
      'geo-country=NZ',
      'show-ads=0',
    ])
  })

  test('visitors from elsewhere are shown ads', async ({ request }) => {
    expect(await cookiesFor(request, 'AU')).toEqual([
      'geo-country=AU',
      'show-ads=1',
    ])
  })

  test('cookies that are already right are not sent again', async ({
    request,
  }) => {
    expect(
      await cookiesFor(request, 'AU', 'geo-country=AU; show-ads=1'),
    ).toEqual([])
  })

  test('a visitor who has moved country gets fresh cookies', async ({
    request,
  }) => {
    expect(
      await cookiesFor(request, 'AU', 'geo-country=NZ; show-ads=0'),
    ).toEqual(['geo-country=AU', 'show-ads=1'])
  })
})
