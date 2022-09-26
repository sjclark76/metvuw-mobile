import GlobalProvider from './GlobalProvider'
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <>
      <main className="relative">
        <GlobalProvider>
          <Navbar />
          {children}

          <div className="w-full py-1.5 px-2 filter  bg-gray-50 w-full sticky bottom-0  z-50">
            <h1 className="text-base text-center font-medium text-sm text-gray-800 my-4 ">
              &copy; metvuwmobile.com
            </h1>
          </div>
        </GlobalProvider>
      </main>
      <footer />
    </>
  )
}
