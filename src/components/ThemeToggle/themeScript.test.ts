import { applyStoredTheme, themeScript } from './themeScript'

// Stored the way the favourite page is: as JSON, by the same jotai storage.
function run(stored: string | null) {
  const setAttribute = vi.fn()
  applyStoredTheme({ getItem: () => stored }, { setAttribute })
  return setAttribute
}

describe('applyStoredTheme', () => {
  test.each(['light', 'dark'])('applies a saved %s choice', (choice) => {
    expect(run(JSON.stringify(choice))).toHaveBeenCalledExactlyOnceWith(
      'data-theme',
      choice,
    )
  })

  // "System" is the stylesheet's own default, so nothing is forced on the page.
  test('leaves the page following the system for the system choice', () => {
    expect(run(JSON.stringify('system'))).not.toHaveBeenCalled()
  })

  test('leaves the page following the system when nothing is saved', () => {
    expect(run(null)).not.toHaveBeenCalled()
  })

  test.each([
    JSON.stringify(''),
    JSON.stringify('auto'),
    JSON.stringify('DARK'),
    JSON.stringify('<script>'),
    JSON.stringify(1),
    JSON.stringify({ theme: 'dark' }),
    JSON.stringify(['dark']),
    'null',
  ])('ignores the unknown value %s', (value) => {
    expect(run(value)).not.toHaveBeenCalled()
  })

  // Not JSON, so not something the app wrote.
  test.each(['dark', 'light', '{broken'])(
    'ignores the unparseable value %j',
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
