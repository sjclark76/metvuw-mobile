import { tolerantStorage } from './tolerantStorage'

describe('tolerantStorage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  test('reads, writes and removes like localStorage', () => {
    tolerantStorage.setItem('k', 'v')
    expect(localStorage.getItem('k')).toBe('v')
    expect(tolerantStorage.getItem('k')).toBe('v')

    tolerantStorage.removeItem('k')
    expect(localStorage.getItem('k')).toBeNull()
  })

  test('reads nothing, rather than throwing, when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })

    expect(tolerantStorage.getItem('k')).toBeNull()
  })

  test('does not throw when storage is blocked or full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })

    expect(() => tolerantStorage.setItem('k', 'v')).not.toThrow()
    expect(() => tolerantStorage.removeItem('k')).not.toThrow()
  })
})
