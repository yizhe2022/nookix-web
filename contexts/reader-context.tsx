"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface ReaderContextType {
  isReaderOpen: boolean
  setIsReaderOpen: (isOpen: boolean) => void
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined)

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [isReaderOpen, setIsReaderOpen] = useState(false)

  return (
    <ReaderContext.Provider value={{ isReaderOpen, setIsReaderOpen }}>
      {children}
    </ReaderContext.Provider>
  )
}

export function useReader() {
  const context = useContext(ReaderContext)
  if (context === undefined) {
    throw new Error("useReader must be used within a ReaderProvider")
  }
  return context
}
