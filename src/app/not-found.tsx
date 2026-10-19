import Link from 'next/link'

import StatusMessage, { actionClasses } from '@/components/StatusMessage'

export default function NotFound() {
  return (
    <StatusMessage
      eyebrow="Error 404"
      title="Page not found"
      actions={
        <Link href="/" className={actionClasses.primary}>
          Go to the home page
        </Link>
      }
    >
      We couldn&apos;t find the page you were looking for.
    </StatusMessage>
  )
}
