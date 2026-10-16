import { fireEvent, render, screen } from '@testing-library/react'

import { AnimationProvider } from '@/components/Animation/Animation'
import { SkinnyChartData } from '@/shared/types/chartData'

import { FooterControl } from './index'

const charts: SkinnyChartData[] = [0, 1, 2, 3, 4].map((hour) => ({
  imageDateUTC: Date.UTC(2026, 9, 1, hour),
  url: `https://example.com/${hour}.webp`,
}))

const renderFooter = () =>
  render(
    <AnimationProvider count={charts.length}>
      <FooterControl />
    </AnimationProvider>,
  )

const open = () =>
  fireEvent.click(screen.getByLabelText('Show animated weather chart'))
const slider = () => screen.getByLabelText('Chart position') as HTMLInputElement

describe('<FooterControl />', () => {
  test('opens the viewer paused, and closes it again', () => {
    renderFooter()
    open()

    expect(screen.getByLabelText('Play animation')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Show static weather chart list'))
    expect(
      screen.getByLabelText('Show animated weather chart'),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Chart position')).toBeNull()
  })

  // Dragging the slider used to leave the interval running, so playback fought
  // the user for the position.
  test('dragging the slider pauses playback and moves to that chart', () => {
    renderFooter()
    open()
    fireEvent.click(screen.getByLabelText('Play animation'))
    expect(screen.getByLabelText('Pause animation')).toBeInTheDocument()

    fireEvent.change(slider(), { target: { value: '3' } })

    expect(screen.getByLabelText('Play animation')).toBeInTheDocument()
    expect(slider().value).toBe('3')
  })

  // A bare range input is announced as a percentage; say which chart it is.
  test('describes the position in words for assistive technology', () => {
    renderFooter()
    open()
    expect(slider()).toHaveAttribute('aria-valuetext', 'Chart 1 of 5')

    fireEvent.click(screen.getByLabelText('Step forward'))

    expect(slider()).toHaveAttribute('aria-valuetext', 'Chart 2 of 5')
  })

  test('the slider spans exactly the charts', () => {
    renderFooter()
    open()

    expect(slider().max).toBe('4')
  })

  test('stepping stops at the first and last chart', () => {
    renderFooter()
    open()

    fireEvent.click(screen.getByLabelText('Step backward'))
    expect(slider().value).toBe('0')

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByLabelText('Step forward'))
    }
    expect(slider().value).toBe('4')
  })
})
