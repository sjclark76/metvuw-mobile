import { render, screen } from '@testing-library/react'

import StatusMessage, { actionClasses } from './StatusMessage'

const renderMessage = (
  props: Partial<Parameters<typeof StatusMessage>[0]> = {},
) =>
  render(
    <StatusMessage
      eyebrow="Offline"
      title="You're offline"
      actions={<a href="/help">Get help</a>}
      {...props}
    >
      Check your connection and try again.
    </StatusMessage>,
  )

describe('<StatusMessage />', () => {
  test('says what happened, in words, with something to do about it', () => {
    renderMessage()

    expect(
      screen.getByRole('heading', { level: 1, name: "You're offline" }),
    ).toBeInTheDocument()
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(
      screen.getByText('Check your connection and try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get help' })).toBeInTheDocument()
  })

  test('has no actions when none are given', () => {
    renderMessage({ actions: undefined })

    expect(screen.queryByRole('link')).toBeNull()
  })

  // An error is announced as it appears; a not-found or offline page is not.
  test('can announce itself as an alert', () => {
    renderMessage({ role: 'alert' })

    expect(screen.getByRole('alert')).toHaveTextContent("You're offline")
  })

  test('is not an alert by default', () => {
    renderMessage()

    expect(screen.queryByRole('alert')).toBeNull()
  })

  test('shares its button styling with the screens that use it', () => {
    expect(actionClasses.primary).toContain('bg-ink')
    expect(actionClasses.primary).toContain('min-h-11')
    expect(actionClasses.secondary).toContain('min-h-11')
  })
})
