import { AppProps } from 'next/app'
import '../styles/globals.css'
import Head from 'next/head'
import { Navbar } from '../components/NavBar'

function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <title>METVUW MOBILE</title>
        <meta name="description" content="Metvuw Mobile" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar />
      <main className="relative">
        <Component {...pageProps} />
      </main>
      <footer />
    </div>
  )
}

export default App
