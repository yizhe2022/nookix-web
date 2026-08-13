'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import TableOfContents from './modules/table-of-contents'

interface BookTocPortalProps {
  sections: { id: string; title: string }[]
}

export default function BookTocPortal({ sections }: BookTocPortalProps) {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      // Check if we've scrolled to the stats section
      const statsSection = document.querySelector('#stats-section') as HTMLElement
      if (statsSection) {
        const statsRect = statsSection.getBoundingClientRect()
        // Hide TOC when stats section reaches near the top of viewport
        setIsVisible(statsRect.top > 200)
      }
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [mounted])

  if (!mounted) return null

  const portalElement = document.querySelector('#book-toc-portal')
  if (!portalElement) return null

  return createPortal(
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <TableOfContents sections={sections} />
    </div>,
    portalElement
  )
}
