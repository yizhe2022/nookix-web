'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface TableOfContentsMobileProps {
  sections: {
    id: string
    title: string
  }[]
}

export default function TableOfContentsMobile({ sections }: TableOfContentsMobileProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sections || sections.length === 0) return null

  return (
    <div className="lg:hidden -mt-5 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-lg font-bold text-gray-900 tracking-tight">Table of Contents</span>
        <ChevronDown 
          className={`h-5 w-5 text-gray-600 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block text-base text-gray-700 py-1 hover:text-blue-600 transition-colors"
            >
              {section.title}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
