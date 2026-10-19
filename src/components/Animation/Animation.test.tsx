import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'

import { AnimationProvider, useAnimation } from './Animation'

type Controls = ReturnType<typeof useAnimation>

let controls!: Controls

function Probe() {
  const current = useAnimation()
  useEffect(() => {
    controls = current
  })
  return (
    <output data-testid="state">
      {JSON.stringify({
        display: current.displayAnimated,
        playing: current.playing,
        index: current.index,
        max: current.max,
        times: current.times,
        intervalMs: current.intervalMs,
      })}
    </output>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent!)

const page = (
  count: number,
  key = 'page',
  intervalMs?: number,
  times?: number[],
) => (
  <AnimationProvider
    key={key}
    count={count}
    intervalMs={intervalMs}
    times={times}
  >
    <Probe />
  </AnimationProvider>
)

describe('Animation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts on the static list, paused, at the first chart', () => {
    render(page(5))

    expect(state()).toEqual({
      display: false,
      playing: false,
      index: 0,
      max: 4,
      times: [],
      intervalMs: 500,
    })
  })

  // The time axis is on the page in both views, so the chart you were looking at
  // is where you stay when you switch between the list and the viewer.
  test('opening the viewer shows it paused; closing it keeps your place', () => {
    render(page(5))

    act(() => controls.seek(3))
    act(() => controls.toggleDisplay())
    expect(state()).toMatchObject({ display: true, playing: false, index: 3 })

    act(() => controls.seek(2))
    act(() => controls.togglePlaying())
    act(() => controls.toggleDisplay())

    expect(state()).toMatchObject({ display: false, playing: false, index: 2 })
  })

  test('knows when each chart is for, so the footer can draw a time axis', () => {
    const times = [1000, 2000, 3000]
    render(page(3, 'page', undefined, times))

    expect(state().times).toEqual(times)
  })

  test('has no times for a page that does not give any', () => {
    render(page(3))

    expect(state().times).toEqual([])
  })

  test('playing advances at the interval and loops back to the start', () => {
    render(page(3, 'page', 500))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    act(() => vi.advanceTimersByTime(500))
    expect(state().index).toBe(1)
    act(() => vi.advanceTimersByTime(500))
    expect(state().index).toBe(2)
    act(() => vi.advanceTimersByTime(500))
    expect(state().index).toBe(0)
  })

  test('uses the interval the page asks for', () => {
    render(page(3, 'page', 1000))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    act(() => vi.advanceTimersByTime(999))
    expect(state().index).toBe(0)
    act(() => vi.advanceTimersByTime(1))
    expect(state().index).toBe(1)
  })

  test('does not advance while paused or while the list is showing', () => {
    render(page(3, 'page', 500))
    act(() => vi.advanceTimersByTime(5000))
    expect(state().index).toBe(0)

    act(() => controls.toggleDisplay())
    act(() => vi.advanceTimersByTime(5000))
    expect(state().index).toBe(0)
  })

  test('stepping pauses playback and stays within the charts', () => {
    render(page(3))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    act(() => controls.stepBackward())
    expect(state()).toMatchObject({ playing: false, index: 0 })

    act(() => controls.stepForward())
    act(() => controls.stepForward())
    act(() => controls.stepForward())
    expect(state().index).toBe(2)
  })

  // Dragging the slider used to leave the interval running, so playback
  // fought the user for the position.
  test('seeking pauses playback and stays within the charts', () => {
    render(page(5, 'page', 500))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    act(() => controls.seek(3))
    expect(state()).toMatchObject({ playing: false, index: 3 })

    act(() => vi.advanceTimersByTime(5000))
    expect(state().index).toBe(3)

    act(() => controls.seek(99))
    expect(state().index).toBe(4)
    act(() => controls.seek(-5))
    expect(state().index).toBe(0)
  })

  // The page can end up with fewer charts than the position it was at.
  test('clamps the position when there are fewer charts', () => {
    const ui = (count: number) => (
      <AnimationProvider count={count}>
        <Probe />
      </AnimationProvider>
    )
    const { rerender } = render(ui(40))
    act(() => controls.toggleDisplay())
    act(() => controls.seek(39))
    expect(state().index).toBe(39)

    rerender(ui(3))

    expect(state()).toMatchObject({ index: 2, max: 2 })
  })

  // Animation state used to live in the layout, so it survived client-side
  // navigation: index 40 on a region page, then a page with 9 images, threw.
  test('a new page starts from the defaults', () => {
    const { rerender } = render(page(40, 'region'))
    act(() => controls.toggleDisplay())
    act(() => controls.seek(39))
    act(() => controls.togglePlaying())

    rerender(page(9, 'satellite'))

    expect(state()).toEqual({
      display: false,
      playing: false,
      index: 0,
      max: 8,
      times: [],
      intervalMs: 500,
    })
  })

  test('a playing page stops ticking when it is left', () => {
    const { rerender } = render(page(5, 'region', 500))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    rerender(page(5, 'satellite', 500))
    act(() => vi.advanceTimersByTime(5000))

    expect(state()).toMatchObject({ playing: false, index: 0 })
  })

  test('leaves no timer running after unmount', () => {
    const { unmount } = render(page(5, 'page', 500))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  test('does not tick when there is only one chart', () => {
    render(page(1, 'page', 500))
    act(() => controls.toggleDisplay())
    act(() => controls.togglePlaying())

    expect(vi.getTimerCount()).toBe(0)
    expect(state()).toMatchObject({ index: 0, max: 0 })
  })

  test('is inert outside a provider', () => {
    render(<Probe />)

    expect(state()).toEqual({
      display: false,
      playing: false,
      index: 0,
      max: 0,
      times: [],
      intervalMs: 500,
    })
    expect(() => {
      act(() => {
        controls.toggleDisplay()
        controls.togglePlaying()
        controls.stepForward()
        controls.seek(3)
      })
    }).not.toThrow()
    expect(state().display).toBe(false)
  })

  // The footer glides its handle over exactly this long while playing, so it
  // arrives at the next chart as the next chart appears.
  test('tells the footer how long each chart is shown', () => {
    render(page(3, 'page', 750))

    expect(state().intervalMs).toBe(750)
  })

  test('defaults to the standard interval when the page gives none', () => {
    render(page(3))

    expect(state().intervalMs).toBe(500)
  })
})
