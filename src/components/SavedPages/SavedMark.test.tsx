import { render, screen } from '@testing-library/react'

import { SavedMark } from './SavedMark'

describe('<SavedMark />', () => {
  test('shows a check, and says so to screen readers, for a saved page', () => {
    const { container } = render(<SavedMark saved />)

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByText('Saved for offline')).toHaveClass('sr-only')
  })

  test('shows nothing for a page that is not saved', () => {
    const { container } = render(<SavedMark saved={false} />)

    expect(container.querySelector('svg')).toBeNull()
    expect(screen.queryByText('Saved for offline')).toBeNull()
  })

  test('holds its space either way, so a link does not change width', () => {
    const saved = render(<SavedMark saved />).container.querySelector('span')
    const unsaved = render(<SavedMark saved={false} />).container.querySelector(
      'span',
    )

    expect(saved).toHaveClass('size-4')
    expect(unsaved).toHaveClass('size-4')
  })
})
