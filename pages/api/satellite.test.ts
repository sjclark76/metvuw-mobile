import { createMocks } from 'node-mocks-http'
import * as s3 from '../api/helpers/s3Helper'
import satelliteDataApi from './satellite'
import { nzRegionCharts } from '../../testing/nz'

jest.spyOn(s3, 's3download')
const mockeds3 = s3 as jest.Mocked<typeof s3>
mockeds3.s3download.mockImplementation()

describe('satellite data api', () => {
  test('calling api for the victoria region should return a 200 success', async () => {
    const { req, res } = createMocks()

    mockeds3.s3download.mockResolvedValueOnce(nzRegionCharts)

    await satelliteDataApi(req, res)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toHaveLength(40)
  })
})
