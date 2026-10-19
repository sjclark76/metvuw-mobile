'use client'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'

/**
 * State of the animated chart viewer: whether it is open, whether it is
 * playing, and which chart it is on. It belongs to the page that renders the
 * charts (the provider), not to the layout, so it starts from the defaults on
 * every navigation and can never point past the charts the page has.
 */
interface State {
  displayAnimated: boolean
  playing: boolean
  index: number
}

type Action =
  | { type: 'toggleDisplay' }
  | { type: 'togglePlaying' }
  | { type: 'seek'; index: number; max: number }
  | { type: 'step'; delta: 1 | -1; max: number }
  | { type: 'tick'; max: number }

const initialState: State = {
  displayAnimated: false,
  playing: false,
  index: 0,
}

const clamp = (index: number, max: number) => Math.min(Math.max(index, 0), max)

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'toggleDisplay':
      // Either way the viewer ends up paused, on the chart you were on.
      return {
        ...state,
        displayAnimated: !state.displayAnimated,
        playing: false,
      }
    case 'togglePlaying':
      return { ...state, playing: !state.playing }
    // Moving by hand always pauses, or the timer would fight the user for the
    // position.
    case 'seek':
      return {
        ...state,
        playing: false,
        index: clamp(action.index, action.max),
      }
    case 'step':
      return {
        ...state,
        playing: false,
        index: clamp(clamp(state.index, action.max) + action.delta, action.max),
      }
    case 'tick':
      return {
        ...state,
        index: (clamp(state.index, action.max) + 1) % (action.max + 1),
      }
  }
}

const DEFAULT_INTERVAL_MS = 500

const NO_TIMES: readonly number[] = []

const AnimationContext = createContext<{
  state: State
  count: number
  times: readonly number[]
  dispatch: (action: Action) => void
} | null>(null)

export function AnimationProvider({
  count,
  times = NO_TIMES,
  intervalMs = DEFAULT_INTERVAL_MS,
  children,
}: {
  /** How many charts the page has. */
  count: number
  /** When each chart is for (epoch ms), in chart order, for the time axis. */
  times?: readonly number[]
  /** Time each chart is shown while playing. */
  intervalMs?: number
  children: ReactNode
}) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const max = Math.max(count - 1, 0)

  useEffect(() => {
    if (!state.playing || !state.displayAnimated || count < 2) return
    const timer = setInterval(() => dispatch({ type: 'tick', max }), intervalMs)
    return () => clearInterval(timer)
  }, [state.playing, state.displayAnimated, count, max, intervalMs])

  const value = useMemo(
    () => ({ state, count, times, dispatch }),
    [state, count, times, dispatch],
  )

  return <AnimationContext value={value}>{children}</AnimationContext>
}

const noop = () => {}

/**
 * The viewer's state and controls. Outside a provider (a page with no
 * animation) it reports the viewer as closed and every control does nothing.
 */
export function useAnimation() {
  const context = useContext(AnimationContext)
  const max = Math.max((context?.count ?? 0) - 1, 0)
  const dispatch = context?.dispatch

  return useMemo(
    () => ({
      displayAnimated: context?.state.displayAnimated ?? false,
      playing: context?.state.playing ?? false,
      // Never past the last chart, even if the page now has fewer charts.
      index: clamp(context?.state.index ?? 0, max),
      max,
      times: context?.times ?? NO_TIMES,
      toggleDisplay: dispatch
        ? () => dispatch({ type: 'toggleDisplay' })
        : noop,
      togglePlaying: dispatch
        ? () => dispatch({ type: 'togglePlaying' })
        : noop,
      stepForward: dispatch
        ? () => dispatch({ type: 'step', delta: 1, max })
        : noop,
      stepBackward: dispatch
        ? () => dispatch({ type: 'step', delta: -1, max })
        : noop,
      seek: dispatch
        ? (index: number) => dispatch({ type: 'seek', index, max })
        : noop,
    }),
    [context?.state, context?.times, dispatch, max],
  )
}
