'use client'

import { useEffect, useRef, useState } from 'react'

import { config } from '@/config'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

// AdSense answers within a second or two. With no answer by then it was blocked
// (an ad blocker, or a network filter), and the card goes rather than stay empty.
const NO_ANSWER_MS = 10_000

export function AdCard() {
  const adRef = useRef<HTMLModElement>(null)
  const adPushed = useRef(false)
  const [adFilled, setAdFilled] = useState<boolean | null>(null)

  useEffect(() => {
    if (adRef.current && !adPushed.current) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        adPushed.current = true
      } catch {
        // adsbygoogle can only be pushed to after mount, so a failure is only known here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAdFilled(false)
        return
      }

      // Observe the data-ad-status attribute that AdSense sets
      const observer = new MutationObserver(() => {
        const status = adRef.current?.getAttribute('data-ad-status')
        if (status === 'filled') {
          setAdFilled(true)
          observer.disconnect()
        } else if (status === 'unfilled') {
          setAdFilled(false)
          observer.disconnect()
        }
      })

      observer.observe(adRef.current, {
        attributes: true,
        attributeFilter: ['data-ad-status'],
      })

      const noAnswer = setTimeout(() => {
        if (!adRef.current?.getAttribute('data-ad-status')) {
          observer.disconnect()
          setAdFilled(false)
        }
      }, NO_ANSWER_MS)

      return () => {
        observer.disconnect()
        clearTimeout(noAnswer)
      }
    }
  }, [])

  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID
  // An ad unit with no slot id can never fill, so don't take up space for one.
  if (adFilled === false || !slotId) return null

  return (
    // Shown, and its room held (min-h-50), while AdSense fills it: AdSense sizes
    // the ad to the slot's width, and will not fill a hidden slot, which has none.
    <div className="bg-plate ring-ink/10 mb-5 w-full rounded-xl pb-3 shadow-lg ring-1">
      <div className="flex min-h-50 items-center justify-center rounded-t-xl p-4">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={config.adsenseClientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
          // Test ads outside production: not counted, so looking at them to
          // check how they look is not invalid traffic.
          {...(process.env.NODE_ENV === 'production'
            ? {}
            : { 'data-adtest': 'on' })}
        />
      </div>
      <div className="flex items-center justify-around rounded-lg pt-3">
        <span className="text-ink-soft text-xs">Sponsored</span>
      </div>
    </div>
  )
}
