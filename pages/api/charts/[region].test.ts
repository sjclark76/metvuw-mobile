import { createMocks } from 'node-mocks-http'

import * as s3 from '../helpers/s3Helper'
import regionDataApi from './[region]'
import { nzRegionCharts } from '../../../testing/nz'

jest.spyOn(s3, 's3download')
const mockeds3 = s3 as jest.Mocked<typeof s3>
mockeds3.s3download.mockImplementation()

describe('region data api', () => {
  test('calling api for the victoria region should return a 200 success', async () => {
    const { req, res } = createMocks({ query: { region: 'victoria' } })

    mockeds3.s3download.mockResolvedValueOnce(nzRegionCharts)

    await regionDataApi(req, res)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toHaveLength(40)
  })
})
