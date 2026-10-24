/**
 * Applies the visitor's Settings for the footer to the page: `data-hide-viewer`
 * and `data-hide-slider` on the page's root, which the stylesheet uses to hide the
 * animated viewer button, the time slider, or the whole footer when both are off;
 * and, for the heavy rain note, `data-has-pins` and `data-hide-heavy-rain`.
 * The choices are saved by jotai's storage atoms as JSON in localStorage, which
 * the host cannot read; so the page is rendered with everything shown, and this is
 * serialised into an inline script that runs before the page first paints, so a
 * hidden footer never flashes. It must stay self-contained: no imports, helpers or
 * closed-over variables.
 */
export function applyStoredLayout(
  storage: Pick<Storage, 'getItem'>,
  root: Pick<Element, 'setAttribute'>,
) {
  try {
    if (JSON.parse(storage.getItem('showViewer') || 'null') === false) {
      root.setAttribute('data-hide-viewer', '')
    }
    if (JSON.parse(storage.getItem('showSlider') || 'null') === false) {
      root.setAttribute('data-hide-slider', '')
    }
    if (JSON.parse(storage.getItem('showHeavyRain') || 'null') === false) {
      root.setAttribute('data-hide-heavy-rain', '')
    }
    // Pins, so the page holds room for the heavy rain note from its first paint.
    const pins = JSON.parse(storage.getItem('pins') || 'null')
    if (Array.isArray(pins) && pins.length > 0) {
      root.setAttribute('data-has-pins', '')
    }
  } catch {
    // Unreadable storage or malformed JSON: show everything.
  }
}

export const layoutScript = `(${applyStoredLayout.toString()})(localStorage,document.documentElement)`
