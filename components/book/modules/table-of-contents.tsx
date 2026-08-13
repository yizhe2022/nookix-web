'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface TableOfContentsProps {
  sections: {
    id: string
    title: string
  }[]
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // 初始化：设置第一个 section 为 active
  useEffect(() => {
    if (sections && sections.length > 0) {
      setActiveSection(sections[0].id)
      setMounted(true)
    }
  }, [sections])

  // 滚动监听
  useEffect(() => {
    if (!mounted || !sections || sections.length === 0) return

    const handleScroll = () => {
      // Find the active section based on scroll position
      const offset = 100 // Offset from top to determine active section
      let currentSection = ''

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= offset && rect.bottom > offset) {
            currentSection = section.id
            break
          }
        }
      }

      // If no section is in the offset zone, find the closest one above
      if (!currentSection) {
        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i].id)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top < offset) {
              currentSection = sections[i].id
              break
            }
          }
        }
      }

      // 如果还是没找到（所有 section 都在视口下方），使用第一个 section
      if (!currentSection && sections.length > 0) {
        currentSection = sections[0].id
      }

      if (currentSection) {
        setActiveSection(currentSection)
      }
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections, mounted])

  if (!sections || sections.length === 0) return null

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
    }
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-3 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight mb-3">Table of Contents</h3>
        <div className="space-y-0.5">
          {sections.map((section) => {
            const isActive = activeSection === section.id
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(e) => handleScrollTo(e, section.id)}
                className={`block w-full px-2 py-1.5 text-sm rounded transition-colors text-left ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50 font-semibold' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium'
                }`}
              >
                <span className="truncate block">{section.title}</span>
              </a>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
