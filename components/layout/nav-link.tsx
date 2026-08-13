"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function NavLink({ href, children, className = "" }: NavLinkProps) {
  const pathname = usePathname()
  
  // 判断是否为当前活动链接
  const isActive = href === "/" 
    ? pathname === "/" 
    : pathname.startsWith(href)
  
  return (
    <Link
      href={href}
      className={`text-sm font-normal transition-colors ${
        isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
      } ${className}`}
    >
      {children}
    </Link>
  )
}
