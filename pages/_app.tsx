import { AppProps } from 'next/app'
import '../styles/globals.css'
import Layout from '../components/Layout'
import { Analytics } from '@vercel/analytics/react'
import { Provider } from 'jotai'

function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <Layout>
        <Component {...pageProps} />
        <Analytics />
      </Layout>
    </Provider>
  )
}

export default App
