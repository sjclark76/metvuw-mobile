import { fireEvent, render } from '@testing-library/react'

import { SkinnyRainChartData } from '@/shared/types/rainChartData'
import { findRegionByCode } from '@/shared/types/region'

import RegionPage from './region-page'

const region = findRegionByCode('nz')!
const charts: SkinnyRainChartData[] = [0, 1, 2, 3].map((day) => ({
  forecastDate: `2026-10-0${day + 1}T00:00:00.000Z`,
  imageDateUTC: Date.UTC(2026, 9, 1),
  url: `https://example.com/chart-${day}.webp`,
}))

const barWidth = (container: HTMLElement) =>
  (container.querySelector('.bg-sky-400') as HTMLElement).style.width

const finishLoading = (container: HTMLElement, count: number) =>
  [...container.querySelectorAll('img')]
    .slice(0, count)
    .forEach((img) => fireEvent.load(img))

describe('<RegionPage /> loading progress', () => {
  let errors: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // React logs this when a component sets another component's state while
  // rendering, which RegionPage used to do on every render. It only fires once
  // the other component (SubHeader) is mounted, so the page must re-render.
  test('does not update another component while rendering', () => {
    const { rerender } = render(
      <RegionPage region={region} rainChartData={charts} />,
    )
    rerender(<RegionPage region={region} rainChartData={[...charts]} />)

    expect(
      errors.mock.calls
        .flat()
        .join(' ')
        .match(/cannot update a component/i),
    ).toBeNull()
  })

  test('starts at zero and fills as the eager charts load', () => {
    const { container } = render(
      <RegionPage region={region} rainChartData={charts} />,
    )
    expect(barWidth(container)).toBe('0%')

    finishLoading(container, 1)
    expect(barWidth(container)).toBe('50%')

    finishLoading(container, 2)
    expect(barWidth(container)).toBe('100%')
  })

  // Re-rendering used to reset every image to "not loaded"; images that had
  // already finished never fire again, so the bar stuck below 100%.
  test('stays at 100% after the page re-renders', () => {
    const { container, rerender } = render(
      <RegionPage region={region} rainChartData={charts} />,
    )
    finishLoading(container, 2)
    expect(barWidth(container)).toBe('100%')

    rerender(<RegionPage region={region} rainChartData={[...charts]} />)
    rerender(<RegionPage region={region} rainChartData={[...charts]} />)

    expect(barWidth(container)).toBe('100%')
  })
})
