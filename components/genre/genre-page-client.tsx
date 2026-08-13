"use client"

import { useState, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { ChevronRight, Layers, Loader2 } from "lucide-react"
import { getGenreWithBooksPaginated } from "@/lib/supabase-service"
import GenreBookListEnhanced from "@/components/genre/genre-book-list-enhanced"

interface Genre {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  featured_image?: string
}

interface GenrePageClientProps {
  initialGenre: Genre
  initialBooks: any[]
  initialHasMore: boolean
  slug: string
}

export default function GenrePageClient({ 
  initialGenre, 
  initialBooks, 
  initialHasMore,
  slug 
}: GenrePageClientProps) {
  const [books, setBooks] = useState(initialBooks)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  })
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    
    try {
      const nextPage = page + 1
      const data = await getGenreWithBooksPaginated(slug, nextPage, 24)
      
      if (data && data.books.length > 0) {
        setBooks(prev => [...prev, ...data.books])
        setPage(nextPage)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more books:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [slug, page, hasMore, isLoading])
  
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore()
    }
  }, [inView, hasMore, isLoading, loadMore])
  
  const coverUrl = initialGenre.featured_image || null

  return (
    <div className="min-h-screen bg-[#FAFAF9] selection:bg-blue-100">
      {/* === 1. 面包屑导航 === */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-4 sm:pb-6 relative z-20">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <ChevronRight className="h-4 w-4" />
          <a href="/genres" className="hover:text-blue-600">Genres</a>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{initialGenre.name}</span>
        </nav>
      </div>

      {/* === 2. Hero 区域 === */}
      <header className="relative overflow-hidden pt-2 sm:pt-6 pb-12 md:pb-16">
        {/* 微弱的背景氛围光 - 延伸更长 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-50/60 blur-[120px] rounded-full pointer-events-none" />
        
        {/* 版心 */}
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 md:gap-12 lg:gap-20 items-start">
            
            {/* 左侧：内容区 */}
            <div className="space-y-6 pt-6 order-2 md:order-1">
              
              {/* 主标题 - 使用 name 字段 */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                {initialGenre.name}
              </h1>

              {/* Description */}
              {initialGenre.description && (
                <p className="text-base text-slate-600 leading-relaxed">
                  {initialGenre.description}
                </p>
              )}

            </div>

            {/* 右侧：长方形封面图 */}
            <div className="relative pt-6 order-1 md:order-2">
              {coverUrl ? (
                <div className="relative w-full aspect-[5/3] rounded-2xl overflow-hidden shadow-xl">
                  <Image 
                    src={coverUrl} 
                    alt={initialGenre.name} 
                    fill 
                    className="object-cover" 
                    priority 
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-[5/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <Layers size={48} className="text-slate-300 mx-auto mb-2" />
                    <span className="text-slate-400 text-sm font-medium">No Image</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* === 3. 书籍列表区 === */}
      <section className="relative max-w-[1024px] mx-auto px-6 sm:px-8 pb-20 sm:pb-24">
        {/* 延续的背景氛围光 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/40 blur-[120px] rounded-full pointer-events-none -z-10" />

        {books.length > 0 ? (
          <>
            <GenreBookListEnhanced books={books} />
            
            {/* 加载更多触发器 */}
            {hasMore && (
              <div ref={ref} className="flex justify-center py-12">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm font-medium">Loading more books...</span>
                  </div>
                ) : (
                  <div className="h-12" />
                )}
              </div>
            )}
            
            {/* 已加载完所有书籍 */}
            {!hasMore && books.length > 24 && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm font-medium">
                  You've reached the end of {initialGenre.name} books
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500">No books found in this genre.</p>
          </div>
        )}
      </section>

    </div>
  )
}
