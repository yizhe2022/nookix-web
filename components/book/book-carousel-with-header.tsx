"use client"

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import BookCarousel from './book-carousel'

interface BookCarouselWithHeaderProps {
  id: string
  title: string
  books: any[]
  isFetching?: string | null
  onPlay?: (book: any) => void
}

export default function BookCarouselWithHeader({ id, title, books, isFetching, onPlay }: BookCarouselWithHeaderProps) {
  const [navState, setNavState] = useState<{ canGoPrev: boolean, canGoNext: boolean, handlePrev: () => void, handleNext: () => void } | null>(null)

  const handleNavigationRender = useCallback((state: { canGoPrev: boolean, canGoNext: boolean, handlePrev: () => void, handleNext: () => void }) => {
    setNavState(state)
  }, [])

  return (
    <Card id={id} className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
          {navState && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={navState.handlePrev}
                disabled={!navState.canGoPrev}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  navState.canGoPrev 
                    ? 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                aria-label="Previous books"
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>
              <button
                onClick={navState.handleNext}
                disabled={!navState.canGoNext}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  navState.canGoNext 
                    ? 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm' 
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
                aria-label="Next books"
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        <BookCarousel 
          books={books}
          itemsPerPage={12}
          isFetching={isFetching}
          onPlay={onPlay}
          showNavigation={true}
          onNavigationRender={handleNavigationRender}
        />
      </CardContent>
    </Card>
  )
}
