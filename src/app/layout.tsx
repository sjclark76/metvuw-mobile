import { Metadata } from 'next'
import '../../styles/globals.css'
import Navbar from '../components/Navbar'

export const metadata: Metadata = {
  title: 'metvuw mobile',
  // description: 'Welcome to Next.js',
}

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="relative">
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  )
}
