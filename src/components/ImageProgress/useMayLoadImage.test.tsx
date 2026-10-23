import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import {
  ImageProgressProvider,
  useMarkImageLoaded,
  useMayLoadImage,
} from './ImageProgress'

const wrapper = ({ children }: { children: ReactNode }) => (
  <ImageProgressProvider expected={2}>{children}</ImageProgressProvider>
)

function Probe({ isFirst }: { isFirst: boolean }) {
  const mayLoad = useMayLoadImage(isFirst)
  const mark = useMarkImageLoaded()
  return (
    <>
      <output data-testid={isFirst ? 'first' : 'later'}>
        {String(mayLoad)}
      </output>
      {isFirst && (
        <button type="button" onClick={() => mark('first.webp')}>
          first loaded
        </button>
      )}
    </>
  )
}

describe('useMayLoadImage', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  test('lets the first chart go at once', () => {
    const { result } = renderHook(() => useMayLoadImage(true), { wrapper })

    expect(result.current).toBe(true)
  })

  test('holds the other charts back until the first has loaded', () => {
    const { result } = renderHook(() => useMayLoadImage(false), { wrapper })

    expect(result.current).toBe(false)
  })

  test('lets the others go once the first has loaded', () => {
    render(
      <ImageProgressProvider expected={2}>
        <Probe isFirst />
        <Probe isFirst={false} />
      </ImageProgressProvider>,
    )
    expect(screen.getByTestId('later')).toHaveTextContent('false')

    act(() => screen.getByRole('button', { name: 'first loaded' }).click())

    expect(screen.getByTestId('later')).toHaveTextContent('true')
  })

  test('lets the others go after four seconds if the first never loads', () => {
    const { result } = renderHook(() => useMayLoadImage(false), { wrapper })

    act(() => vi.advanceTimersByTime(3900))
    expect(result.current).toBe(false)

    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(true)
  })

  test('holds nothing back outside a page that is counting its charts', () => {
    const { result } = renderHook(() => useMayLoadImage(false))

    expect(result.current).toBe(true)
  })

  test('stops waiting when the page goes away', () => {
    const { unmount } = renderHook(() => useMayLoadImage(false), { wrapper })

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
