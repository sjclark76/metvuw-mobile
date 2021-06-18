import { Navbar } from './NavBar'
import GlobalProvider from './GlobalProvider'

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
