'use client'

import { useAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import React from 'react'

import { favoritePageAtom } from '../Atoms/GlobalState'
import HomeIcon from '../icons/HomeIcon'
import HomeIconOutlined from '../icons/HomeIconOutlined'

const SetHomePageIcon = () => {
  const [favoritePage, setFavoritePage] = useAtom(favoritePageAtom)
  const pathname = usePathname()

  const isFavorite = favoritePage === pathname

  const handleClick = () => {
    if (isFavorite) {
      setFavoritePage(null)
    } else {
      setFavoritePage(pathname)
    }
  }

  const tooltipText = isFavorite ? 'Unset as home page' : 'Set as home page'

  return (
    <button onClick={handleClick} className="p-2" title={tooltipText}>
      {isFavorite ? (
        <HomeIcon className="h-6 w-6 text-sky-400" />
      ) : (
        <HomeIconOutlined className="h-6 w-6 text-white" />
      )}
    </button>
  )
}

export default SetHomePageIcon
