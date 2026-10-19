/**
 * Applies the visitor's saved light or dark choice to the page. `theme` is saved
 * by jotai's storage atom as JSON, like the favourite page, in localStorage,
 * which the host cannot read; so the page is rendered without it, and this is
 * serialised into an inline script that runs before the page first paints, so a
 * saved choice never flashes the other theme. For "system", or nothing saved,
 * the attribute is left off and the stylesheet follows the device's setting.
 * It must stay self-contained: no imports, helpers or closed-over variables.
 */
export function applyStoredTheme(
  storage: Pick<Storage, 'getItem'>,
  root: Pick<Element, 'setAttribute'>,
) {
  try {
    const theme = JSON.parse(storage.getItem('theme') || 'null')
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme)
    }
  } catch {
    // Unreadable storage or malformed JSON: follow the system.
  }
}

export const themeScript = `(${applyStoredTheme.toString()})(localStorage,document.documentElement)`
