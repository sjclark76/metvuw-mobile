import { render, screen } from '@testing-library/react'

import { SavedPage } from '@/shared/helpers/offline/savedPages'

import { OfflineNotice } from './OfflineNotice'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 20, 12)

const state = vi.hoisted(() => ({
  path: '/regions/nz' as string | null,
  online: false,
  pages: [] as SavedPage[],
}))

vi.mock('next/navigation', () => ({ usePathname: () => state.path }))
vi.mock('@/components/Hooks/useOnline', () => ({
  useOnline: () => state.online,
}))
vi.mock('@/components/Hooks/useNow', () => ({ useNow: () => NOW }))
vi.mock('./useSavedPages', () => ({
  useSavedPageList: () => ({ pages: state.pages, remove: vi.fn() }),
}))

const saved = (overrides: Partial<SavedPage> = {}): SavedPage => ({
  path: '/regions/nz',
  title: 'New Zealand',
  issued: NOW - 3 * HOUR,
  refreshedAt: NOW - 2 * HOUR,
  urls: [],
  bytes: 1,
  ...overrides,
})

describe('<OfflineNotice />', () => {
  beforeEach(() => {
    Object.assign(state, { path: '/regions/nz', online: false, pages: [] })
  })

  test('says nothing while there is a connection', () => {
    state.online = true
    state.pages = [saved()]

    const { container } = render(<OfflineNotice />)

    expect(container).toBeEmptyDOMElement()
  })

  test('on a saved page, says when it was saved and when the forecast was issued', () => {
    state.pages = [saved()]

    render(<OfflineNotice />)

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent("You're offline")
    expect(notice).toHaveTextContent('Charts saved 2 hours ago')
    expect(notice).toHaveTextContent('Forecast issued')
    expect(notice).not.toHaveTextContent('Out of date')
  })

  test('warns when the forecast is more than a day old', () => {
    state.pages = [saved({ issued: NOW - 3 * 24 * HOUR })]

    render(<OfflineNotice />)

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent('Out of date')
    expect(notice).toHaveTextContent('3 days ago')
    expect(notice).toHaveTextContent('Conditions may have changed')
  })

  test('a forecast just under a day old is not yet out of date', () => {
    state.pages = [saved({ issued: NOW - 23 * HOUR })]

    render(<OfflineNotice />)

    expect(screen.getByRole('status')).not.toHaveTextContent('Out of date')
  })

  test('copes with a saved page that has no issue time', () => {
    state.pages = [saved({ issued: undefined })]

    render(<OfflineNotice />)

    expect(screen.getByRole('status')).toHaveTextContent('Charts saved')
    expect(screen.getByRole('status')).not.toHaveTextContent('issued')
  })

  test('on a page that is not saved, says only what has been seen can be shown', () => {
    state.pages = [saved({ path: '/satellite' })]

    render(<OfflineNotice />)

    const notice = screen.getByRole('status')
    expect(notice).toHaveTextContent("You're offline.")
    expect(notice).toHaveTextContent(
      'Charts you have already viewed on this device can still be shown.',
    )
    expect(notice).not.toHaveTextContent('Charts saved')
  })

  test('says nothing when the page is not known', () => {
    state.path = null

    const { container } = render(<OfflineNotice />)

    expect(container).toBeEmptyDOMElement()
  })
})
