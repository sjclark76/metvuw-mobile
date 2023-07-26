import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <>
      <main className="relative">
        <Navbar />
        {children}
        <Footer />
      </main>
      <footer />
    </>
  )
}
