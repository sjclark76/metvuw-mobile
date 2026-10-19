/**
 * Applies the visitor's saved light or dark choice to the page. `theme` lives in
 * localStorage, which the host cannot read, so the page is rendered without it;
 * this is serialised into an inline script that runs before the page first
 * paints, so a saved choice never flashes the other theme. With nothing saved,
 * the attribute is left off and the stylesheet follows the system setting.
 * It must stay self-contained: no imports, helpers or closed-over variables.
 */
export function applyStoredTheme(
  storage: Pick<Storage, 'getItem'>,
  root: Pick<Element, 'setAttribute'>,
) {
  try {
    const theme = storage.getItem('theme')
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme)
    }
  } catch {
    // Unreadable storage: follow the system.
  }
}

export const themeScript = `(${applyStoredTheme.toString()})(localStorage,document.documentElement)`
