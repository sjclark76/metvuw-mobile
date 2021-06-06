import { decodeSrc, getImageUrls } from './[region]'

describe('', () => {
  it('blh', async () => {
    const result = await getImageUrls('f')
    console.debug(result)
  })
})

describe('decode url', () => {
  it('blah blah', () => {
    // Given
    const url = './2021060418/rain-nz-2021060418-006.gif'

    const result = decodeSrc(url)

    expect(result.issueDate).toStrictEqual(new Date('04 Jun 2021 18:00:00 GMT'))
    expect(result.forecastDate).toStrictEqual(
      new Date('05 Jun 2021 00:00:00 GMT')
    )
    expect(result.offset).toBe(6)
  })
})
