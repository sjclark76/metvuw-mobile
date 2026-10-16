import { metadata } from './page'

// The page had no <title>, so a screen reader announced nothing for it and the
// browser tab showed the URL.
describe('offline page', () => {
  test('has a title that names the page and the site', () => {
    expect(String(metadata.title)).toMatch(/offline/i)
    expect(String(metadata.title)).toMatch(/metvuw/i)
  })
})
