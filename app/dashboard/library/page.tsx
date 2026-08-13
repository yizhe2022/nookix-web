"use client"

import { useRef } from "react"
import LibraryContent from "@/components/library/library-content"

export default function DashboardLibraryPage() {
  const libraryContentRef = useRef<any>(null)
  
  // 通过 window 绑定，方便全局调用
  if (typeof window !== 'undefined') {
    (window as any).refreshLibraryBooks = () => {
      libraryContentRef.current?.refreshLibraryBooks()
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-12 lg:pb-20">
      <LibraryContent ref={libraryContentRef} />
    </div>
  )
}
