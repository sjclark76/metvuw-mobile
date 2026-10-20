import { fireEvent, render, screen } from '@testing-library/react'

import { SavedPage } from '@/shared/helpers/offline/savedPages'

import { SaveForOfflineButton } from './SaveForOfflineButton'
import { SaveStatus } from './useSavedPages'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 21, 12)

const state = vi.hoisted(() => ({
  path: '/regions/nz' as string | null,
  online: true,
  supported: true,
  saved: undefined as SavedPage | undefined,
  status: 'idle' as SaveStatus,
  save: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('next/navigation', () => ({ usePathname: () => state.path }))
vi.mock('@/components/Hooks/useNow', () => ({ useNow: () => NOW }))
vi.mock('@/components/Hooks/useOnline', () => ({
  useOnline: () => state.online,
}))
vi.mock('./browserDependencies', () => ({
  supportsSavingPages: () => state.supported,
}))
vi.mock('./useSavedPages', () => ({
  useSavedPage: () => ({
    saved: state.saved,
    status: state.status,
    save: state.save,
    remove: state.remove,
  }),
}))

const saved: SavedPage = {
  path: '/regions/nz',
  title: 'New Zealand',
  issued: NOW - 3 * HOUR,
  refreshedAt: 1,
  urls: [],
  bytes: 2.1 * 1024 * 1024,
}

const button = () => screen.getByRole('button', { name: 'Save for offline' })

describe('<SaveForOfflineButton />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(state, {
      path: '/regions/nz',
      online: true,
      supported: true,
      saved: undefined,
      status: 'idle',
    })
  })

  test('offers to save a page that is not saved', () => {
    render(<SaveForOfflineButton />)

    expect(button()).toHaveAttribute('aria-pressed', 'false')
    expect(button()).toBeEnabled()
  })

  test('saves it when pressed', () => {
    render(<SaveForOfflineButton />)

    fireEvent.click(button())

    expect(state.save).toHaveBeenCalledTimes(1)
    expect(state.remove).not.toHaveBeenCalled()
  })

  test('shows a saved page as pressed, and up to date while its forecast is the newest', () => {
    state.saved = saved

    render(<SaveForOfflineButton />)

    expect(button()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Saved · up to date')
  })

  test('says how long ago the forecast was issued once a newer one is due', () => {
    state.saved = { ...saved, issued: NOW - 17 * HOUR }

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved · issued 17 hours ago',
    )
  })

  test('says the same with no connection: it is a fact either way', () => {
    state.online = false
    state.saved = { ...saved, issued: NOW - 17 * HOUR }

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Saved · issued 17 hours ago',
    )
  })

  test('just says Saved when it is not known when the forecast was issued', () => {
    state.saved = { ...saved, issued: undefined }

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).toHaveTextContent(/^Saved$/)
  })

  test('does not show the size: that is on the Saved page', () => {
    state.saved = saved

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).not.toHaveTextContent(/MB|KB/)
  })

  test('forgets a saved page when pressed again', () => {
    state.saved = saved

    render(<SaveForOfflineButton />)
    fireEvent.click(button())

    expect(state.remove).toHaveBeenCalledTimes(1)
    expect(state.save).not.toHaveBeenCalled()
  })

  test('says it is saving, and cannot be pressed meanwhile', () => {
    state.status = 'saving'

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).toHaveTextContent('Saving')
    expect(button()).toBeDisabled()
  })

  test('says what went wrong, and offers another try', () => {
    state.status = 'failed'

    render(<SaveForOfflineButton />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Could not save. Check your connection and try again.',
    )
    expect(button()).toBeEnabled()
    fireEvent.click(button())
    expect(state.save).toHaveBeenCalledTimes(1)
  })

  test('cannot save while offline, and says why', () => {
    state.online = false

    render(<SaveForOfflineButton />)

    expect(button()).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Connect to save this page',
    )
  })

  test('a page that is saved can still be forgotten while offline', () => {
    state.online = false
    state.saved = saved

    render(<SaveForOfflineButton />)

    expect(button()).toBeEnabled()
    fireEvent.click(button())
    expect(state.remove).toHaveBeenCalledTimes(1)
  })

  test('is not offered where pages cannot be saved', () => {
    state.supported = false

    render(<SaveForOfflineButton />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  test('is not offered when the page is not known', () => {
    state.path = null

    render(<SaveForOfflineButton />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  // The button only appears once the page is running in the browser; its space
  // is held from the first paint so nothing below it jumps.
  test('holds its space even where nothing is offered', () => {
    state.supported = false

    const { container } = render(<SaveForOfflineButton />)

    expect(container.firstElementChild).toHaveClass('min-h-9')
  })

  test('keeps a saved message on one line, so it cannot change the height', () => {
    state.saved = saved

    const { container } = render(<SaveForOfflineButton />)

    expect(container.firstElementChild).toHaveClass('flex-nowrap')
    expect(screen.getByRole('status')).toHaveClass('truncate')
  })

  test('lets a failure message wrap: it follows a press, not a page load', () => {
    state.status = 'failed'

    const { container } = render(<SaveForOfflineButton />)

    expect(container.firstElementChild).toHaveClass('flex-wrap')
    expect(screen.getByRole('status')).not.toHaveClass('truncate')
  })
})
