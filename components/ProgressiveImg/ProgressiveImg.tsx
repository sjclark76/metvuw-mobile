import { useState, useEffect } from 'react'
import styles from './ProgressiveImg.module.css'
export const ProgressiveImg = ({ placeholderSrc, src, ...props }) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src)

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImgSrc(src)
    }
  }, [src])

  const customClass =
    placeholderSrc && imgSrc === placeholderSrc ? styles.loading : styles.loaded

  return (
    <img
      src={imgSrc}
      {...props}
      className={`${props.className} ${customClass}`}
      alt={props.alt || ''}
    />
  )
}
