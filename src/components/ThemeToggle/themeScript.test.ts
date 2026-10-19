import { applyStoredTheme, themeScript } from './themeScript'

function run(stored: string | null) {
  const setAttribute = vi.fn()
  applyStoredTheme({ getItem: () => stored }, { setAttribute })
  return setAttribute
}

describe('applyStoredTheme', () => {
  test.each(['light', 'dark'])('applies a saved %s choice', (choice) => {
    expect(run(choice)).toHaveBeenCalledExactlyOnceWith('data-theme', choice)
  })

  // No saved choice means "follow the system", which the stylesheet does by
  // itself; the page must not be forced either way.
  test('leaves the page following the system when nothing is saved', () => {
    expect(run(null)).not.toHaveBeenCalled()
  })

  test.each(['', 'auto', 'DARK', 'blue', '<script>'])(
    'ignores the unknown value %j',
    (value) => {
      expect(run(value)).not.toHaveBeenCalled()
    },
  )

  test('swallows unreadable storage', () => {
    const setAttribute = vi.fn()

    expect(() =>
      applyStoredTheme(
        {
          getItem: () => {
            throw new Error('storage is blocked')
          },
        },
        { setAttribute },
      ),
    ).not.toThrow()
    expect(setAttribute).not.toHaveBeenCalled()
  })
})

describe('themeScript', () => {
  // It runs as an inline script before the page paints, so it must carry its own
  // logic: nothing imported, nothing closed over. That it really applies a saved
  // theme before first paint is checked in the browser (e2e/theme.spec.ts).
  test('is the function, called with the browser globals', () => {
    expect(themeScript).toMatch(
      /^\(function[\s\S]*\)\(localStorage,\s*document\.documentElement\)$/,
    )
  })

  test('contains no reference to anything outside itself', () => {
    expect(themeScript).not.toMatch(/\bimport\b|\brequire\b/)
  })
})
