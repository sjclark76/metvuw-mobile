import { createMocks } from 'node-mocks-http'
import axios from 'axios'

import * as s3 from '../helpers/s3Helper'
import { nzForecastHtml } from '../../../testing/html/nzRegion'
import regionCacheApi from './[region]'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.spyOn(s3, 's3upload')
const mockeds3 = s3 as jest.Mocked<typeof s3>
mockeds3.s3upload.mockImplementation()

describe('region cache api', () => {
  test('calling api for the victoria region should return a 200 success', async () => {
    const { req, res } = createMocks({ query: { region: 'victoria' } })

    mockedAxios.get.mockResolvedValueOnce({
      data: nzForecastHtml,
    })

    await regionCacheApi(req, res)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      success: true,
      fileName: 'victoria.json',
    })
  })

  test('calling api with no specified region should return a 200 but defaulted to nz', async () => {
    const { req, res } = createMocks()

    mockedAxios.get.mockResolvedValueOnce({
      data: nzForecastHtml,
    })

    await regionCacheApi(req, res)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      success: true,
      fileName: 'nz.json',
    })
  })

  test('calling api for an invalid region should return a 400 bad request', async () => {
    const { req, res } = createMocks({ query: { region: 'foo baa' } })

    mockedAxios.get.mockResolvedValueOnce({
      data: nzForecastHtml,
    })

    await regionCacheApi(req, res)

    expect(res.statusCode).toBe(400)
  })
})
