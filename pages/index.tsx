import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAtomValue } from 'jotai'
import { favouritePageAtom } from '../components/Navbar/state/favouritePageAtom'

function Home() {
  const favouritePage = useAtomValue(favouritePageAtom)

  const router = useRouter()
  useEffect(() => {
    const { pathname } = router
    if (pathname === '/') {
      if (favouritePage !== undefined) {
        router.replace(favouritePage)
      } else {
        router.replace('/regions/nz')
      }
    }
  }, [favouritePage, router])
}
export default Home
