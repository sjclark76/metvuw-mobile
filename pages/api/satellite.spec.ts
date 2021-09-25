import { getSatelliteImageUrls } from './satellite'

describe('', () => {
  test('retrieving sattelite images should be successful', async () => {
    const result = await getSatelliteImageUrls()
    console.debug(result)
  })
})
