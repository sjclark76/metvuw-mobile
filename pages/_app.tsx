import { AppProps } from 'next/app'
import '../styles/globals.css'
import Layout from '../components/Layout'
import { Analytics } from '@vercel/analytics/react'

function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
      <Analytics />
    </Layout>
  )
}

export default App
