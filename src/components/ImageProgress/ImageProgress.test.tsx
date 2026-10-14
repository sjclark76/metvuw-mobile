import { act, render, screen } from '@testing-library/react'

import {
  ImageProgressProvider,
  useImageProgress,
  useMarkImageLoaded,
} from './ImageProgress'

function Probe({ onMark }: { onMark?: (mark: (src: string) => void) => void }) {
  const progress = useImageProgress()
  const markLoaded = useMarkImageLoaded()
  onMark?.(markLoaded)
  return <output data-testid="progress">{progress}</output>
}

const progress = () => screen.getByTestId('progress').textContent

describe('ImageProgress', () => {
  test('is the share of expected images that have loaded', () => {
    let mark!: (src: string) => void
    render(
      <ImageProgressProvider expected={4}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>,
    )
    expect(progress()).toBe('0')

    act(() => mark('a.webp'))
    expect(progress()).toBe('25')

    act(() => mark('b.webp'))
    expect(progress()).toBe('50')
  })

  test('counts each image once, however often it reports', () => {
    let mark!: (src: string) => void
    render(
      <ImageProgressProvider expected={2}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>,
    )

    act(() => {
      mark('a.webp')
      mark('a.webp')
      mark('a.webp')
    })

    expect(progress()).toBe('50')
  })

  test('never exceeds 100% when more images load than were expected', () => {
    let mark!: (src: string) => void
    render(
      <ImageProgressProvider expected={2}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>,
    )

    act(() => {
      ;['a', 'b', 'c', 'd'].forEach((src) => mark(`${src}.webp`))
    })

    expect(progress()).toBe('100')
  })

  // Re-rendering the page used to reset every image to "not loaded"; images
  // that had already finished never report again, so the bar stuck.
  test('keeps its progress when the page re-renders', () => {
    let mark!: (src: string) => void
    const ui = (
      <ImageProgressProvider expected={1}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>
    )
    const { rerender } = render(ui)
    act(() => mark('a.webp'))
    expect(progress()).toBe('100')

    rerender(ui)
    rerender(ui)

    expect(progress()).toBe('100')
  })

  test('adjusts to a changed expectation without losing what has loaded', () => {
    let mark!: (src: string) => void
    const ui = (expected: number) => (
      <ImageProgressProvider expected={expected}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>
    )
    const { rerender } = render(ui(2))
    act(() => mark('a.webp'))
    expect(progress()).toBe('50')

    rerender(ui(1))

    expect(progress()).toBe('100')
  })

  test('starts from zero on a new page, because state belongs to the page', () => {
    let mark!: (src: string) => void
    const page = (key: string) => (
      <ImageProgressProvider key={key} expected={1}>
        <Probe onMark={(m) => (mark = m)} />
      </ImageProgressProvider>
    )
    const { rerender } = render(page('region'))
    act(() => mark('a.webp'))
    expect(progress()).toBe('100')

    rerender(page('satellite'))

    expect(progress()).toBe('0')
  })

  test('is zero when nothing is expected', () => {
    render(
      <ImageProgressProvider expected={0}>
        <Probe />
      </ImageProgressProvider>,
    )

    expect(progress()).toBe('0')
  })

  test('is inert outside a provider', () => {
    let mark!: (src: string) => void
    render(<Probe onMark={(m) => (mark = m)} />)

    expect(() => act(() => mark('a.webp'))).not.toThrow()
    expect(progress()).toBe('0')
  })
})
