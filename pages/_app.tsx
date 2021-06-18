import { AppProps } from 'next/app'
import '../styles/globals.css'
import Layout from '../components/Layout'

function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default App
