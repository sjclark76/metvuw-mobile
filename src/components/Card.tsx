import clsx from 'clsx'
import { ReactNode } from 'react'

/**
 * A chart on the page. There is no card: the page is the chart's own paper
 * colour, so the chart sits straight on it with a faint outline, and its
 * caption underneath. In dark mode charts cannot be recoloured, so they sit on
 * a framed plate instead.
 */
export default function Card({
  weatherImage,
  caption,
  isLoading = false,
}: {
  weatherImage: ReactNode
  caption: ReactNode
  isLoading?: boolean
}) {
  const styling = clsx('mb-7 w-full', isLoading && 'animate-pulse')
  return (
    <article className={styling}>
      <div className="dark:bg-plate [&_img]:outline-rule dark:mx-3 dark:rounded-lg dark:p-1.5 md:dark:mx-0 [&_img]:outline-1 [&_img]:-outline-offset-1 dark:[&_img]:rounded-sm dark:[&_img]:brightness-90">
        {weatherImage}
      </div>
      {caption}
    </article>
  )
}
