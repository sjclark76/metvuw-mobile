import { fireEvent, render, screen } from '@testing-library/react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { FooterControl } from '@/components/FooterControl'
import RadarAndSatelliteImages from '@/components/RadarAndSatelliteImages/RadarAndSatelliteImages'
import { SkinnyChartData } from '@/shared/types/chartData'

const charts = (count: number): SkinnyChartData[] =>
  Array.from({ length: count }, (_, hour) => ({
    imageDateUTC: Date.UTC(2026, 9, 1, hour),
    url: `https://example.com/${count}-${hour}.webp`,
  }))

const page = (key: string, count: number) => (
  <AnimationProvider key={key} count={count}>
    <RadarAndSatelliteImages images={charts(count)} chartType="Satellite" />
    <FooterControl />
  </AnimationProvider>
)

const currentImage = () =>
  (document.querySelector('main img, img') as HTMLImageElement).src

describe('animated viewer and footer together', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('the viewer shows the chart the footer is on', () => {
    render(page('satellite', 5))
    fireEvent.click(screen.getByLabelText('Show animated weather chart'))
    expect(currentImage()).toContain('5-0.webp')

    fireEvent.click(screen.getByLabelText('Step forward'))
    fireEvent.click(screen.getByLabelText('Step forward'))

    expect(currentImage()).toContain('5-2.webp')
  })

  // Index 40 on a region page, then a client-side navigation to a page with
  // fewer images, used to throw "Cannot read properties of undefined".
  test('opening a shorter page after the end of a longer one does not crash', () => {
    const { rerender } = render(page('region', 40))
    fireEvent.click(screen.getByLabelText('Show animated weather chart'))
    fireEvent.change(screen.getByLabelText('Chart position'), {
      target: { value: '39' },
    })
    expect(currentImage()).toContain('40-39.webp')

    expect(() => rerender(page('satellite', 3))).not.toThrow()

    // The new page starts on its static list, not the old viewer.
    expect(screen.queryByLabelText('Chart position')).toBeNull()
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  test('a page that shrinks while the viewer is open stays on a valid chart', () => {
    const ui = (count: number) => (
      <AnimationProvider count={count}>
        <RadarAndSatelliteImages images={charts(count)} chartType="Satellite" />
        <FooterControl />
      </AnimationProvider>
    )
    const { rerender } = render(ui(40))
    fireEvent.click(screen.getByLabelText('Show animated weather chart'))
    fireEvent.change(screen.getByLabelText('Chart position'), {
      target: { value: '39' },
    })

    expect(() => rerender(ui(3))).not.toThrow()

    expect(currentImage()).toContain('3-2.webp')
  })
})
