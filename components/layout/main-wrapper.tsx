"use client"

import { usePathname } from "next/navigation"
import type React from "react"

interface MainWrapperProps {
  children: React.ReactNode
}

export default function MainWrapper({ children }: MainWrapperProps) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith("/auth/")

  return <main className="min-h-screen bg-[#fafbfc]">{children}</main>
}