/**
 * Marks where the top of a chart page ends: its title and details, and anything
 * under them before the charts. On a small screen the footer stays out of the way
 * until this has scrolled off the top, so the first screen is mostly chart (see
 * `useFooterTucked`). Takes no room.
 */
export function PageTopEnd() {
  return <div data-page-top-end aria-hidden="true" />
}
