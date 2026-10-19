import type { Metadata } from 'next'
import Link from 'next/link'

import { ReloadWhenOnline } from '@/components/ReloadWhenOnline'
import StatusMessage, { actionClasses } from '@/components/StatusMessage'

export const metadata: Metadata = { title: 'metvuw mobile | Offline' }

export default function OfflinePage() {
  return (
    <>
      <ReloadWhenOnline />
      <StatusMessage
        eyebrow="No connection"
        title="You're offline"
        actions={
          <Link href="/" className={actionClasses.primary}>
            Go to the home page
          </Link>
        }
      >
        It looks like you&apos;re not connected to the internet. Check your
        connection and this page will reload by itself.
      </StatusMessage>
    </>
  )
}
