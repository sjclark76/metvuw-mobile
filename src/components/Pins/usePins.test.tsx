import { act, renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { ReactNode } from 'react'

import { pinsAtom } from '@/components/Atoms/GlobalState'
import type { Place } from '@/shared/helpers/places'

import { usePins } from './usePins'

const wanaka: Place = {
  name: 'Wanaka',
  context: 'Otago',
  kind: 'Town',
  latitude: -44.703,
  longitude: 169.132,
}
const hooker: Place = {
  name: 'Hooker Hut',
  context: 'Canterbury',
  kind: 'Hut',
  latitude: -43.6,
  longitude: 170,
}

const setup = () => {
  const store = createStore()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  return { store, ...renderHook(() => usePins(), { wrapper }) }
}

describe('usePins', () => {
  beforeEach(() => localStorage.clear())

  test('starts with no pins', () => {
    expect(setup().result.current.pins).toEqual([])
  })

  test('adds a pin, and it is in the list', () => {
    const { result } = setup()

    act(() => result.current.add(wanaka))

    expect(result.current.pins.map((pin) => pin.name)).toEqual(['Wanaka'])
  })

  test('does not pin a place twice', () => {
    const { result } = setup()

    act(() => {
      result.current.add(wanaka)
      result.current.add(wanaka)
    })

    expect(result.current.pins).toHaveLength(1)
  })

  test('keeps every pin when two are added in one go', () => {
    const { result } = setup()

    act(() => {
      result.current.add(wanaka)
      result.current.add(hooker)
    })

    expect(result.current.pins.map((pin) => pin.name)).toEqual([
      'Wanaka',
      'Hooker Hut',
    ])
  })

  test('labels a pin, and clears the label', () => {
    const { result } = setup()
    act(() => result.current.add(wanaka))
    const [{ id }] = result.current.pins

    act(() => result.current.setLabel(id, 'Home'))
    expect(result.current.pins[0].label).toBe('Home')

    act(() => result.current.setLabel(id, ''))
    expect(result.current.pins[0].label).toBeUndefined()
  })

  test('removes a pin', () => {
    const { result } = setup()
    act(() => {
      result.current.add(wanaka)
      result.current.add(hooker)
    })

    act(() => result.current.remove(result.current.pins[0].id))

    expect(result.current.pins.map((pin) => pin.name)).toEqual(['Hooker Hut'])
  })

  test('is saved as JSON under its own key, so it survives a reload', () => {
    const { result } = setup()

    act(() => result.current.add(wanaka))

    const saved = JSON.parse(localStorage.getItem('pins')!)
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ name: 'Wanaka', latitude: -44.703 })
    expect(localStorage.getItem('savedPages')).toBeNull()
  })

  test('is read when the atom is created, before the first render', async () => {
    localStorage.setItem(
      'pins',
      JSON.stringify([
        {
          name: 'Wanaka',
          context: 'Otago',
          kind: 'Town',
          latitude: -44.703,
          longitude: 169.132,
        },
      ]),
    )
    vi.resetModules()
    const { pinsAtom: fresh } = await import('@/components/Atoms/GlobalState')
    const store = createStore()

    expect((store.get(fresh) as unknown[]).length).toBe(1)
  })

  test('ignores junk in storage, and still lets a pin be added', () => {
    const { result, store } = setup()
    store.set(pinsAtom, [null, 'x', { name: '' }])

    expect(result.current.pins).toEqual([])
    act(() => result.current.add(wanaka))
    expect(result.current.pins).toHaveLength(1)
  })

  test('does not throw when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })
    const { result } = setup()

    expect(() => act(() => result.current.add(wanaka))).not.toThrow()
    expect(result.current.pins).toHaveLength(1)
    vi.restoreAllMocks()
  })
})
