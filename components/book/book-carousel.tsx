"use client"

import { useState, useEffect, memo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Loader2, Headphones } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getAuthorName } from '@/lib/author-utils'

interface BookCarouselProps {
  books: any[]
  itemsPerPage?: number
  isFetching?: string | null
  onPlay?: (book: any) => void
  showNavigation?: boolean
  onNavigationRender?: (navState: { canGoPrev: boolean, canGoNext: boolean, handlePrev: () => void, handleNext: () => void }) => void
}

export default function BookCarousel({ books, itemsPerPage = 12, isFetching, onPlay, showNavigation = true, onNavigationRender }: BookCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Ensure we have books to display
  if (!books || books.length === 0) {
    return null
  }

  // For desktop: show 5 full books + 0.5 book (5.5 total visible)
  // Calculate max scroll to avoid empty space at the end
  const visibleCount = 5.5
  const scrollAmount = 5
  
  // Calculate the maximum index where we can scroll to
  // We want to ensure the last book is at the right edge when fully scrolled
  const maxIndex = Math.max(0, books.length - visibleCount)

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - scrollAmount))
  }

  const handleNext = () => {
    setCurrentIndex(prev => {
      const nextIndex = prev + scrollAmount
      // Don't scroll past the point where the last book would be visible
      return Math.min(maxIndex, nextIndex)
    })
  }

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < maxIndex - 0.1 // Small threshold to account for floating point

  // Update navigation state when it changes
  useEffect(() => {
    if (onNavigationRender && showNavigation && mounted) {
      onNavigationRender({ canGoPrev, canGoNext, handlePrev, handleNext })
    }
  }, [canGoPrev, canGoNext, mounted, showNavigation])

  return (
    <>
      {/* Mobile view - 2 columns, 6 books */}
      <div className="grid grid-cols-2 gap-4 lg:hidden">
        {books.slice(0, 6).map(book => (
          <BookCard key={book.id} book={book} isFetching={isFetching === book.id} onPlay={onPlay} />
        ))}
      </div>

      {/* Desktop view - horizontal scrolling carousel showing 5.5 books */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Scrollable container with overflow hidden and mask-based fade effect */}
          <div 
            className="overflow-hidden relative"
            style={{
              maskImage: canGoNext ? 'linear-gradient(to right, black calc(100% - 80px), transparent 100%)' : 'none',
              WebkitMaskImage: canGoNext ? 'linear-gradient(to right, black calc(100% - 80px), transparent 100%)' : 'none'
            }}
          >
            <div 
              className="flex gap-5 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / 5.5)}%)`
              }}
            >
              {books.map(book => (
                <div key={book.id} className="flex-shrink-0" style={{ width: 'calc((100% - 5 * 1.25rem) / 5.5)' }}>
                  <BookCard book={book} isFetching={isFetching === book.id} onPlay={onPlay} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const BookCard = memo(({ book, isFetching, onPlay }: { book: any, isFetching: boolean, onPlay?: (book: any) => void }) => {
  // 使用纯 slug 作为 URL
  const bookUrl = `/book/${book.slug}`
  
  return (
    <div className="relative group">
      <Link href={bookUrl} className="block outline-none">
        <div className="flex flex-col">
          <div className="relative mb-4">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:ring-black/[0.08] isolate">
              <Image
                src={book.cover_image || '/placeholder.svg'}
                alt={book.title || 'Nookix Cover'}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 200px"
                className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
              />
            </div>
          </div>
          <div className="px-1 relative z-10 space-y-2">
            <h3 className="line-clamp-2 text-balance text-[14px] font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[15px]">{book.title}</h3>
            <p className="line-clamp-1 text-[13px] font-medium text-slate-600">{getAuthorName(book)}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{book.audio_duration ? `${Math.ceil(book.audio_duration / 60)}min` : '30min'}</span>
              </div>
              {book.rating > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-gray-500">{book.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      {onPlay && (
        <div className="absolute top-0 left-0 right-0 aspect-[2/3] flex items-center justify-center pointer-events-none z-20">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5 opacity-0 scale-90 transition-all duration-300 pointer-events-auto hover:scale-105 active:scale-95 group-hover:opacity-100 group-hover:scale-100"
            disabled={isFetching}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(book); }}
          >
            {isFetching ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <Headphones size={18} strokeWidth={2.2} className="ml-0.5" />}
          </button>
        </div>
      )}
    </div>
  )
})
BookCard.displayName = 'BookCard'
