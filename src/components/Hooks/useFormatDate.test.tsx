import { renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import type { ReactNode } from 'react'

import { clockAtom, type ClockChoice } from '@/components/Atoms/GlobalState'

import { useFormatDate } from './useFormatDate'

// The hook shows times in the viewer's zone: pin it, so the test is the same
// wherever it runs.
vi.mock('@/shared/helpers/timeZone', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/helpers/timeZone')>()),
  getBrowserTimeZone: () => 'Pacific/Auckland',
}))

// 2:00pm in Auckland (NZDT, UTC+13).
const afternoon = Date.UTC(2026, 10, 7, 1, 0)

const format = (clock?: ClockChoice, formatString = 'HH:mm') => {
  const store = createStore()
  if (clock) store.set(clockAtom, clock)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return renderHook(() => useFormatDate(), { wrapper }).result.current(
    afternoon,
    formatString,
  )
}

describe('useFormatDate and the clock', () => {
  test('writes 24-hour times unless 12-hour is chosen', () => {
    expect(format()).toBe('14:00')
    expect(format('24h')).toBe('14:00')
  })

  test('writes the same time 12-hour when chosen', () => {
    expect(format('12h')).toBe('2:00pm')
    expect(format('12h', 'EEE HH:mm')).toBe('Sat 2:00pm')
  })

  test('leaves times that are already 12-hour alone', () => {
    expect(format('12h', 'EEE h:mmaaa')).toBe('Sat 2:00pm')
    expect(format('24h', 'EEE h:mmaaa')).toBe('Sat 2:00pm')
  })
})
