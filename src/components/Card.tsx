import clsx from 'clsx'
import { ReactNode } from 'react'

export default function Card({
  weatherImage,
  date,
  time,
  isLoading = false,
}: {
  weatherImage: ReactNode
  date: ReactNode
  time: ReactNode
  isLoading?: boolean
}) {
  const styling = clsx(
    'mb-5 rounded-xl bg-white pb-3 dark:bg-stone-700 drop-shadow-2xl w-full ',
    // 'sm:w-4/5 xl:w-5/12 2xl:w-1/2 ',
    isLoading && 'animate-pulse',
  )
  return (
    <div className={styling}>
      {weatherImage}
      <div className="flex items-center justify-around rounded-b-lg pt-3">
        {date}
        {time}
      </div>
    </div>
  )
}
