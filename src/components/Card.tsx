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
    'mb-5 w-full  rounded-xl bg-white pt-5 drop-shadow-2xl  filter sm:w-4/5  xl:w-1/2 2xl:w-1/2 ',
    isLoading && 'animate-pulse',
  )
  return (
    <li className={styling}>
      {weatherImage}
      <div className="flex items-center justify-around rounded-b-lg bg-white py-3">
        {date}
        {time}
      </div>
    </li>
  )
}
