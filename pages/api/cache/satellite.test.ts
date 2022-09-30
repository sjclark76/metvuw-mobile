import { createMocks } from 'node-mocks-http'
import axios from 'axios'
import satelliteCacheApi from './satellite'
import { satelliteHtml } from '../../../testing/html/satellite'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>
jest.mock('../helpers/s3Helper')

describe('satellite cache api', () => {
  test('calling api should return a 200 success', async () => {
    const { req, res } = createMocks()

    mockedAxios.get.mockResolvedValueOnce({
      data: satelliteHtml,
    })

    await satelliteCacheApi(req, res)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      bucket: 'metvuw-mobile',
      success: true,
      fileName: 'satellite.json',
    })
  })
})
