import { StarIcon as SolidStarIcon } from '@heroicons/react/24/solid'
import { StarIcon as OutlineStarIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { favouritePageAtom } from '../Navbar/state/favouritePageAtom'
import { MenuLink } from '../Navbar/types'
export function Favourite({ menuLink }: { menuLink: MenuLink }) {
  const [favouritePage, setFavouritePage] = useAtom(favouritePageAtom)

  const isChecked = favouritePage === menuLink.href
  function handleCheckboxChange() {
    setFavouritePage(isChecked ? undefined : menuLink.href)
  }

  return isChecked ? (
    <SolidStarIcon
      title="Remove as home page"
      onClick={() => handleCheckboxChange()}
      className="h-6 w-6 text-blue-500"
    />
  ) : (
    <OutlineStarIcon
      title="Set as home page"
      onClick={() => handleCheckboxChange()}
      className="h-6 w-6 text-blue-500"
    />
  )
}
