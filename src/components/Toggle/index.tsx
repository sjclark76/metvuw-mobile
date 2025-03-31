'use client'
import { ReactNode } from 'react'
import { Switch } from 'react-aria-components'

type ToggleProps = {
  children: ReactNode
  isSelected: boolean
  onChange: (isSelected: boolean) => void
}

function Toggle({ children, isSelected, onChange }: ToggleProps) {
  return (
    <>
      <Switch
        isSelected={isSelected}
        onChange={onChange}
        className="group flex items-center gap-2"
      >
        <div
          className={`group-focus-visible:ring-primary flex h-6 w-12 cursor-pointer rounded-full bg-neutral-400 p-0.5 transition group-focus-visible:ring-2 group-focus-visible:ring-offset-2 motion-reduce:transition-none ${
            isSelected ? 'bg-slate-600' : ''
          }`}
        >
          <span
            className={`h-5 w-5 transform rounded-full bg-white duration-200 ${
              isSelected ? 'translate-x-6' : ''
            } transition`}
          />
        </div>
        {children}
      </Switch>
    </>
  )
}

export { Toggle }
