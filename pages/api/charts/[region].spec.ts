import { decodeSrc, getImageUrls } from './[region]'

describe('', () => {
  it('blh', async () => {
    const result = await getImageUrls('f')
    console.debug(result)
  })
})

describe('decode url', () => {
  it('rain-nz should be correct', () => {
    // Given
    const url = './2021060418/rain-nz-2021060418-006.gif'

    const result = decodeSrc(url)

    expect(result.issueDate).toStrictEqual('2021-06-04T18:00:00.000Z')
    expect(result.forecastDate).toStrictEqual('2021-06-05T00:00:00.000Z')
    expect(result.offset).toBe(6)
  })

  it('rain-nzni should be correct', () => {
    // Given
    const url = './2021060418/rain-nzni-2021060800-006.gif'

    const result = decodeSrc(url)

    expect(result.issueDate).toStrictEqual('2021-06-08T00:00:00.000Z')
    expect(result.forecastDate).toStrictEqual('2021-06-08T06:00:00.000Z')
    expect(result.offset).toBe(6)
  })

  it('rain-usa should be correct', () => {
    // Given
    const url = './2021060600/rain-usa-2021060600-006.gif'

    const result = decodeSrc(url)

    expect(result.issueDate).toStrictEqual('2021-06-06T00:00:00.000Z')
    expect(result.forecastDate).toStrictEqual('2021-06-06T06:00:00.000Z')
    expect(result.offset).toBe(6)
  })

  it('rain-usa ssssshould be correct', () => {
    // Given
    const url = './2021060900/rain-nzni-2021060900-006.gif'

    const result = decodeSrc(url)

    expect(result.issueDate).toStrictEqual('2021-06-06T00:00:00.000Z')
    expect(result.forecastDate).toStrictEqual('2021-06-06T06:00:00.000Z')
    expect(result.offset).toBe(6)
  })
})
