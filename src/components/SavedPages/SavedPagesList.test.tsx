import { fireEvent, render, screen, within } from '@testing-library/react'

import { SavedPage } from '@/shared/helpers/offline/savedPages'

import { SavedPagesList } from './SavedPagesList'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 9, 20, 12)

const state = vi.hoisted(() => ({
  pages: [] as SavedPage[],
  mounted: true,
  remove: vi.fn(),
}))

vi.mock('@/components/Hooks/useIsMounted', () => ({
  useIsMounted: () => state.mounted,
}))
vi.mock('@/components/Hooks/useNow', () => ({ useNow: () => NOW }))
vi.mock('./useSavedPages', () => ({
  useSavedPageList: () => ({ pages: state.pages, remove: state.remove }),
}))

const saved = (
  path: string,
  overrides: Partial<SavedPage> = {},
): SavedPage => ({
  path,
  title: `Title of ${path}`,
  issued: NOW - 3 * HOUR,
  refreshedAt: NOW - 2 * HOUR,
  urls: [],
  bytes: 2.1 * 1024 * 1024,
  ...overrides,
})

describe('<SavedPagesList />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(state, { pages: [], mounted: true })
  })

  test('says how to save a page when nothing is saved', () => {
    render(<SavedPagesList />)

    expect(
      screen.getByText(/Open a chart page and choose Save for offline/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  test('lists each saved page as a link to it', () => {
    state.pages = [saved('/regions/nz'), saved('/satellite')]

    render(<SavedPagesList />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(
      within(items[0]).getByRole('link', { name: 'Title of /regions/nz' }),
    ).toHaveAttribute('href', '/regions/nz')
    expect(
      within(items[1]).getByRole('link', { name: 'Title of /satellite' }),
    ).toHaveAttribute('href', '/satellite')
  })

  test('shows how big each is and when it was last checked', () => {
    state.pages = [saved('/regions/nz')]

    render(<SavedPagesList />)

    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('2.1 MB')
    expect(item).toHaveTextContent('Checked 2 hours ago')
    expect(item).toHaveTextContent('Issued')
  })

  test('shows the total kept', () => {
    state.pages = [saved('/a'), saved('/b')]

    render(<SavedPagesList />)

    expect(screen.getByText('4.2 MB on this device')).toBeInTheDocument()
  })

  test('removes a page, named so it is clear which', () => {
    state.pages = [saved('/regions/nz'), saved('/satellite')]

    render(<SavedPagesList />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Title of /satellite' }),
    )

    expect(state.remove).toHaveBeenCalledWith('/satellite')
  })

  test('draws nothing until the page is running in the browser', () => {
    state.mounted = false
    state.pages = [saved('/regions/nz')]

    const { container } = render(<SavedPagesList />)

    expect(container).toBeEmptyDOMElement()
  })
})
