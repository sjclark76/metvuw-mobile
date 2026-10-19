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
    <button
      onClick={handleClick}
      className="p-2.5"
      title={tooltipText}
      aria-label="Use this page as my home page"
      aria-pressed={isFavorite}
    >
      {isFavorite ? (
        <HomeIcon className="text-bar-ink h-6 w-6" />
      ) : (
        <HomeIconOutlined className="text-bar-ink h-6 w-6" />
      )}
    </button>
  )
}

export default SetHomePageIcon
