import type { ComponentProps } from 'react'

import type { FetchedSounding } from '@/shared/helpers/sounding/fetchSounding'

import { UpperAirPage } from './UpperAirPage'

/**
 * The upper air page once the balloon data has come. Wyoming can take 8 to 12 s
 * to answer, so the page waits for it inside a Suspense boundary (see the upper
 * air route), showing metvuw's charts until then.
 */
export async function UpperAirPageWithSounding({
  sounding,
  ...page
}: Omit<ComponentProps<typeof UpperAirPage>, 'sounding'> & {
  sounding: Promise<FetchedSounding | undefined>
}) {
  return <UpperAirPage {...page} sounding={await sounding} />
}
