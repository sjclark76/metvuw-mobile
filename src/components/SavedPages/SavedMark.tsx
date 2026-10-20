/**
 * A small check beside a menu item that has been saved for offline use, with the
 * same words for screen readers. Its space is always held, so a link does not
 * change width when the mark arrives (what is saved is only known in the browser).
 */
export function SavedMark({ saved }: { saved: boolean }) {
  return (
    <>
      {/* A space between the name before it and this, or a link's accessible name
          runs the two together ("South IslandSaved for offline"). It sits outside
          the element because a name is trimmed within each element. */}
      {saved && ' '}
      <span className="inline-flex size-4 shrink-0 items-center justify-center">
        {saved && (
          <>
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              aria-hidden="true"
              focusable="false"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <span className="sr-only">Saved for offline</span>
          </>
        )}
      </span>
    </>
  )
}
