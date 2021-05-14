import { AppProps } from 'next/app'
import '../styles/globals.css'
//import 'tailwindcss/tailwind.css'
function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}

export default App