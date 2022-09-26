import GlobalProvider from './GlobalProvider'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <>
      <main className="relative">
        <GlobalProvider>
          <Navbar />
          {children}
          <Footer />
        </GlobalProvider>
      </main>
      <footer />
    </>
  )
}
