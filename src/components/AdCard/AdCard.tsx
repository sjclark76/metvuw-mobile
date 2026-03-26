'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

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

      return () => observer.disconnect()
    }
  }, [])

  if (adFilled === false) return null

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID

  return (
    <div
      className="mb-5 w-full rounded-xl bg-white pb-3 drop-shadow-2xl dark:bg-stone-700"
      style={{ display: adFilled === null ? 'none' : undefined }}
    >
      <div className="flex min-h-[200px] items-center justify-center rounded-t-xl p-4">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
      <div className="flex items-center justify-around rounded-lg pt-3">
        <span className="text-xs text-gray-400 dark:text-stone-300">
          Sponsored
        </span>
      </div>
    </div>
  )
}
