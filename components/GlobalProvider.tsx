import React, { createContext, useState, FC } from 'react'
import { GlobalContextState } from '../shared/state'

const contextDefaultValues: GlobalContextState = {
  setSubmenuText(): void {},
  submenuText: '',
}

export const GlobalContext =
  createContext<GlobalContextState>(contextDefaultValues)

const GlobalProvider: FC = ({ children }) => {
  const [submenuText, setText] = useState<string>(
    contextDefaultValues.submenuText
  )

  const setSubmenuText = (newTodo: string) => setText(newTodo)

  return (
    <GlobalContext.Provider
      value={{
        submenuText,
        setSubmenuText,
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}

export default GlobalProvider
