import { render, screen } from '@testing-library/react'

import ChartCaption from './ChartCaption'

describe('<ChartCaption />', () => {
  test('shows the day, the time, the date and how far ahead it is', () => {
    render(
      <ChartCaption day="Mon" time="13:00" date="19 OCT NZDT" lead="T+06" />,
    )

    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('13:00')).toBeInTheDocument()
    expect(screen.getByText('19 OCT NZDT')).toBeInTheDocument()
    expect(screen.getByText('T+06')).toBeInTheDocument()
  })

  test('leaves out the lead time for charts that are observations', () => {
    const { container } = render(
      <ChartCaption day="Mon" time="13:00" date="19 OCT NZDT" />,
    )

    expect(container.querySelectorAll('span')).toHaveLength(2)
  })

  // The time is the big one, with the day above the date beside it.
  test('sets the time in display type and the day over the date', () => {
    render(<ChartCaption day="Mon" time="13:00" date="19 OCT NZDT" />)

    expect(screen.getByText('13:00')).toHaveClass('font-display')
    expect(screen.getByText('Mon')).not.toHaveClass('font-display')
    expect(screen.getByText('Mon').textContent).toContain('19 OCT NZDT')
  })

  // The day block is two lines tall; aligning on the first baseline made the
  // big time look low, so the columns are centred on one line.
  test('centres its columns on one line', () => {
    const { container } = render(
      <ChartCaption day="Mon" time="13:00" date="19 OCT NZDT" />,
    )

    expect(container.firstElementChild).toHaveClass('items-center')
    expect(container.firstElementChild).not.toHaveClass('items-baseline')
  })
})
