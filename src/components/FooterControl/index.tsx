'use client'
import { useAtom } from 'jotai/index'
import { ChangeEvent, useCallback, useMemo } from 'react'

import {
  animatedChartIndexAtom,
  displayAnimatedChartAtom,
  playAnimationAtom,
} from '@/components/Atoms/GlobalState'
import { SkinnyRainChartData } from '@/shared/types/rainChartData'

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M8 5v14l11-7z"></path>
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
    </svg>
  )
}

function FooterControl({ charts }: { charts: SkinnyRainChartData[] }) {
  const [playAnimation, setPlayAnimation] = useAtom(playAnimationAtom)
  const [displayAnimatedChart, setDisplayAnimatedChart] = useAtom(
    displayAnimatedChartAtom,
  )
  const [animatedChartIndex, setAnimatedChartIndex] = useAtom(
    animatedChartIndexAtom,
  )

  const handleMasterPlay = useCallback(() => {
    setDisplayAnimatedChart((prev) => !prev)
    setPlayAnimation((prevState) => !prevState)
  }, [setPlayAnimation, setDisplayAnimatedChart])

  const handleProgressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAnimatedChartIndex(Number(e.target.value))
  }

  const max = useMemo(
    () => (charts && charts.length > 0 ? charts.length - 1 : 0),
    [charts],
  )

  return (
    <footer className="sticky bottom-0 z-20 border-t border-gray-300 bg-gray-100 p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div className="container mx-auto flex flex-row items-center justify-start space-x-4 lg:gap-5">
        <button
          onClick={handleMasterPlay}
          className="transform rounded-full bg-slate-700 p-4 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
          aria-label={
            displayAnimatedChart
              ? 'Show static weather chart list'
              : 'Show animated weather chart'
          }
        >
          {displayAnimatedChart ? <CrossIcon /> : <PlayIcon />}
        </button>
        {displayAnimatedChart && (
          <>
            <button
              onClick={() => setPlayAnimation((prev) => !prev)}
              className="transform rounded-full bg-slate-700 p-4 text-sky-400 shadow-lg transition-all hover:scale-110 hover:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:outline-none"
              aria-label={playAnimation ? 'Pause animation' : 'Play animation'}
            >
              {playAnimation ? <PauseIcon /> : <PlayIcon />}
            </button>
            <input
              type="range"
              min="0"
              max={max}
              value={animatedChartIndex}
              onChange={handleProgressChange}
              className="w-3/4 text-sky-400"
            />
          </>
        )}
      </div>
    </footer>
  )
}
export { FooterControl }
