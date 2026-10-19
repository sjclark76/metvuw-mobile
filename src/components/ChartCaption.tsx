import { ReactNode } from 'react'

/**
 * The line under a chart: the day in display type, the time over the date, and
 * how far ahead it is. Centred on one line because the time block is two lines
 * tall, so aligning on the first baseline made the day look low.
 */
export default function ChartCaption({
  day,
  time,
  date,
  lead,
}: {
  day: ReactNode
  time: ReactNode
  date: ReactNode
  lead?: ReactNode
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3.5 px-4 pt-2.5 md:px-0">
      <span className="font-display text-ink text-[2.1rem] leading-[0.9] font-bold tracking-[0.04em] uppercase">
        {day}
      </span>
      <span className="text-ink font-mono text-[0.95rem] leading-tight font-medium">
        {time}
        <small className="text-ink-soft block font-mono text-xs font-normal">
          {date}
        </small>
      </span>
      {lead && (
        <span className="text-ink-soft font-mono text-xs font-medium tracking-[0.04em]">
          {lead}
        </span>
      )}
    </div>
  )
}
