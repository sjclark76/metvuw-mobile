import { applyStoredLayout } from './layoutScript'

function run(saved: Record<string, string>) {
  const attributes = new Set<string>()
  applyStoredLayout(
    { getItem: (key) => saved[key] ?? null },
    { setAttribute: (name: string) => void attributes.add(name) },
  )
  return attributes
}

describe('applyStoredLayout', () => {
  test('hides nothing when nothing is saved', () => {
    expect(run({})).toEqual(new Set())
  })

  test('hides the viewer when it was turned off', () => {
    expect(run({ showViewer: 'false' })).toEqual(new Set(['data-hide-viewer']))
  })

  test('hides the slider when it was turned off', () => {
    expect(run({ showSlider: 'false' })).toEqual(new Set(['data-hide-slider']))
  })

  test('hides both when both were turned off', () => {
    expect(run({ showViewer: 'false', showSlider: 'false' })).toEqual(
      new Set(['data-hide-viewer', 'data-hide-slider']),
    )
  })

  test('shows both when they were turned on again', () => {
    expect(run({ showViewer: 'true', showSlider: 'true' })).toEqual(new Set())
  })

  test('shows everything when what was saved cannot be read', () => {
    expect(run({ showViewer: '{not json', showSlider: 'maybe' })).toEqual(
      new Set(),
    )
  })

  test('shows everything when storage itself fails', () => {
    const attributes = new Set<string>()
    expect(() =>
      applyStoredLayout(
        {
          getItem: () => {
            throw new Error('blocked')
          },
        },
        { setAttribute: (name: string) => void attributes.add(name) },
      ),
    ).not.toThrow()
    expect(attributes.size).toBe(0)
  })
})
