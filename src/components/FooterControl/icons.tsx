import { ReactNode } from 'react'

// One set for the footer: drawn on a 24px grid, one size, 2px round strokes.
// Play and pause are solid because they are the main action in the viewer.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const OpenViewerIcon = () => (
  <Icon>
    <rect x="3" y="6" width="13" height="12" rx="1.5" />
    <path d="M19.5 8.5v7M22 10v4" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Icon>
)

export const PlayIcon = () => (
  <Icon>
    <path d="M8 5.8v12.4L18.5 12z" fill="currentColor" />
  </Icon>
)

export const PauseIcon = () => (
  <Icon>
    <path d="M8.5 6v12M15.5 6v12" strokeWidth="3" />
  </Icon>
)

export const StepBackIcon = () => (
  <Icon>
    <path d="M14.5 6l-6 6 6 6" />
  </Icon>
)

export const StepForwardIcon = () => (
  <Icon>
    <path d="M9.5 6l6 6-6 6" />
  </Icon>
)
