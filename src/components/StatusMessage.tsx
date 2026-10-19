import { ReactNode } from 'react'

const action =
  'inline-flex min-h-11 items-center justify-center rounded px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cold'

/** Button styling for the actions, shared so every message looks the same. */
export const actionClasses = {
  primary: `${action} bg-ink text-paper hover:bg-ink-soft`,
  secondary: `${action} border border-ink/30 text-ink hover:bg-rule`,
}

/**
 * A whole-page message (offline, not found, something broke): a small label for
 * the kind of message, a heading that says what happened, a plain explanation,
 * and the actions that get the visitor out of it. It is set like the head of a
 * chart page, so these screens belong to the same site.
 */
export default function StatusMessage({
  eyebrow,
  title,
  children,
  actions,
  role,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  actions?: ReactNode
  role?: 'alert'
}) {
  return (
    <section
      role={role}
      className="mx-auto flex min-h-[60vh] max-w-176 flex-col justify-center px-4 py-12 md:px-0"
    >
      <p className="text-ink-soft font-mono text-xs tracking-[0.12em] uppercase">
        {eyebrow}
      </p>
      <h1 className="font-display text-ink mt-2 mb-3 text-[clamp(2.6rem,11vw,4rem)] leading-[0.95] font-bold tracking-[0.015em] uppercase">
        {title}
      </h1>
      <p className="text-ink-soft max-w-md text-lg leading-snug">{children}</p>
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </section>
  )
}
