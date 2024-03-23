'use client'
import '../../styles/globals.css'
import Navbar from '../components/Navbar'
import GoogleTag from '@/components/GoogleTag'
import Footer from '@/components/Footer'
import SubHeader from '@/components/SubHeader'

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <GoogleTag />
      <body>
        <main className="relative">
          <div className="sticky top-0 z-50">
            <Navbar />
            <SubHeader />
          </div>
          {children}
          <Footer />
        </main>
      </body>
    </html>
  )
}
