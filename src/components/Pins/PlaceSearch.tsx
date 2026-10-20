'use client'
import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react'

import { pinId } from '@/shared/helpers/pins/pins'
import {
  type Place,
  PLACES_ATTRIBUTION,
  searchPlaces,
} from '@/shared/helpers/places'

const MIN_QUERY_LENGTH = 2

type Status = 'idle' | 'searching' | 'done' | 'failed'

/**
 * Search for a place to pin. Typing lists matches (name, then what it is and where);
 * tapping one pins it at once, using the place's own name, clears the box and says
 * so. A place that is pinned already is shown as such and cannot be tapped.
 */
export function PlaceSearch({
  pinned,
  onPick,
}: {
  /** The ids of the places already pinned. */
  pinned: ReadonlySet<string>
  onPick: (place: Place) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [announcement, setAnnouncement] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const inputId = useId()

  useEffect(() => {
    // Nothing is looked for until there is enough to go on.
    if (query.trim().length < MIN_QUERY_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      setStatus('idle')
      return
    }
    // A slower search for an earlier query must not overwrite a newer one.
    let current = true
    setStatus('searching')
    searchPlaces(query)
      .then((found) => {
        if (!current) return
        setResults(found)
        setStatus('done')
      })
      .catch(() => {
        if (!current) return
        setResults([])
        setStatus('failed')
      })
    return () => {
      current = false
    }
  }, [query])

  const pick = (place: Place) => {
    onPick(place)
    setQuery('')
    setAnnouncement(`Pinned ${place.name}`)
    input.current?.focus()
  }

  // The matches you can pin, in order: a place already pinned cannot be chosen.
  const choices = () =>
    Array.from(
      list.current?.querySelectorAll('button:not(:disabled)') ?? [],
    ).filter((el): el is HTMLButtonElement => el instanceof HTMLButtonElement)

  // Arrow Down from the box goes to the first match; the arrows then move through
  // the matches, and Arrow Up from the first goes back to the box.
  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown') return
    const first = choices()[0]
    if (!first) return
    event.preventDefault()
    first.focus()
  }
  const onListKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const all = choices()
    const at = all.findIndex((el) => el === document.activeElement)
    const next = at + (event.key === 'ArrowDown' ? 1 : -1)
    if (next < 0) input.current?.focus()
    else all[Math.min(next, all.length - 1)]?.focus()
  }

  const message =
    status === 'failed'
      ? 'Could not load the list of places. Check your connection and try again.'
      : status === 'done' && results.length === 0
        ? `No places found for “${query.trim()}”.`
        : announcement

  return (
    <div>
      <label
        htmlFor={inputId}
        className="text-ink-soft font-mono text-xs tracking-[0.12em] uppercase"
      >
        Add a place
      </label>
      <input
        id={inputId}
        ref={input}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setAnnouncement('')
        }}
        onKeyDown={onInputKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Search, for example Wanaka"
        className="border-rule bg-plate text-ink focus-visible:outline-cold mt-2 block min-h-11 w-full rounded border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />

      <p role="status" className="text-ink-soft mt-2 min-h-5 font-mono text-xs">
        {message}
      </p>

      {results.length > 0 && (
        <ul
          ref={list}
          onKeyDown={onListKeyDown}
          aria-label="Matching places"
          className="border-rule divide-rule mt-1 divide-y border-y"
        >
          {results.map((place) => {
            const isPinned = pinned.has(pinId(place))
            return (
              <li key={`${place.name}|${place.latitude}|${place.longitude}`}>
                <button
                  type="button"
                  disabled={isPinned}
                  onClick={() => pick(place)}
                  className="text-ink hover:bg-paper focus-visible:outline-cold flex min-h-11 w-full items-center justify-between gap-3 px-1 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{place.name}</span>
                    <span className="text-ink-soft block font-mono text-xs">
                      {place.kind} · {place.context}
                    </span>
                  </span>
                  {isPinned && (
                    <span className="text-ink-soft shrink-0 font-mono text-xs">
                      Pinned
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-ink-soft mt-3 text-xs">{PLACES_ATTRIBUTION}</p>
    </div>
  )
}
