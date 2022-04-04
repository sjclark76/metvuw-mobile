import GlobalProvider from './GlobalProvider'
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <>
      <main className="relative">
        <GlobalProvider>
          <Navbar />
          {children}
        </GlobalProvider>
      </main>
      <footer />
    </>
  )
}
