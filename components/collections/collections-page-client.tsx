"use client"

import { useState, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import Image from "next/image"
import { Layers, Clock, ArrowRight, Sparkles, BookOpen, Headphones, Loader2 } from "lucide-react"
import { getAllCollectionsPaginated } from "@/lib/supabase-service"

interface Book {
  id: string
  title: string
  cover_image: string
  audio_duration: number
}

interface Collection {
  id: string
  title: string
  slug: string
  tagline: string
  description: string
  collection_cover_url: string
  featured_image_url: string
  books: Book[]
  bookCount: number
  allBooks?: any[]
}

interface CollectionsPageClientProps {
  initialCollections: any[]
  initialHasMore: boolean
}

export default function CollectionsPageClient({ 
  initialCollections, 
  initialHasMore 
}: CollectionsPageClientProps) {
  const [collections, setCollections] = useState(initialCollections)
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
      const data = await getAllCollectionsPaginated(nextPage, 15)
      
      if (data && data.collections.length > 0) {
        // 转换数据格式
        const transformedCollections = data.collections.map((collection: any) => {
          const allBooks = collection.allBooks || collection.books
          const totalSeconds = allBooks.reduce((sum: number, book: any) => {
            const duration = book.audio_duration || 0
            return sum + duration
          }, 0)
          const totalHours = (totalSeconds / 3600).toFixed(1)
          
          return {
            id: collection.id,
            title: collection.title,
            slug: collection.slug,
            tagline: collection.tagline || "Explore curated insights.",
            description: collection.description || "A curated collection of essential books.",
            totalBooks: collection.bookCount,
            totalDuration: `${totalHours} Hours`,
            coverUrl: collection.featured_image_url || collection.collection_cover_url || '/placeholder.svg',
            books: collection.books.slice(0, 3)
          }
        })
        
        setCollections(prev => [...prev, ...transformedCollections])
        setPage(nextPage)
        setHasMore(data.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more collections:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [page, hasMore, isLoading])
  
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore()
    }
  }, [inView, hasMore, isLoading, loadMore])

  const featuredCollection = collections[0]
  const listCollections = collections.slice(1)

  return (
    <div className="min-h-screen bg-[#FAFAF9] selection:bg-blue-100 pb-16 sm:pb-24">
      {/* --- Header 区域 --- */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/60 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-[1024px] mx-auto px-6 sm:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-blue-200/60 bg-blue-50 mb-6">
            <Sparkles size={12} className="text-blue-600" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600">
              Curated Pathways
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Discover Good Audio Books<br className="hidden md:block" />{' '}
            <span className="text-slate-400">& Fresh Book Ideas</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Browsing for your next listen? Explore our curated library of top ranked audio books. Whether you need book ideas for your startup journey or just some great audio books for the commute, find them here, summarized in 30 minutes.
          </p>
        </div>
      </section>

      <div className="max-w-[1024px] mx-auto px-6 sm:px-8 space-y-12 sm:space-y-20">

        {/* --- 1. 头条推荐书单 (Featured Collection) - 克制而精致 --- */}
        {featuredCollection && (
          <section className="relative group">
            <Link href={`/collections/${featuredCollection.slug}`} className="block outline-none">
              <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 ring-1 ring-black/[0.04] shadow-[0_20px_60px_-16px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)] hover:ring-black/[0.08] transition-all duration-500 flex flex-col md:flex-row items-center gap-10 md:gap-16 overflow-hidden">
                
                {/* 1:1 比例的封面 */}
                <div className="relative w-full md:w-[320px] aspect-square shrink-0 rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] shadow-xl group-hover:-translate-y-1 transition-transform duration-500 ease-out">
                  <Image 
                    src={featuredCollection.coverUrl} 
                    alt="Featured Cover" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    priority 
                  />
                  {/* 悬浮时的耳机遮罩 */}
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center text-slate-900 scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Headphones size={24} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* 文字区 */}
                <div className="flex-1 relative z-10 flex flex-col">
                  <div className="inline-flex items-center gap-2 mb-4 text-blue-600">
                     <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                     <span className="text-xs font-bold tracking-widest uppercase">Selected Collection</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 group-hover:text-blue-600 transition-colors leading-tight text-balance">
                    {featuredCollection.title}
                  </h2>
                  <p className="text-lg text-slate-600 font-semibold mb-4 leading-snug">
                    {featuredCollection.tagline}
                  </p>
                  <p className="text-[15px] text-slate-500 leading-relaxed mb-8 font-medium">
                    {featuredCollection.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500 mt-auto">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg ring-1 ring-black/[0.03]">
                      <BookOpen size={16} className="text-blue-500" />
                      <span>{featuredCollection.totalBooks} Books</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg ring-1 ring-black/[0.03]">
                      <Clock size={16} className="text-emerald-500" />
                      <span>{featuredCollection.totalDuration}</span>
                    </div>
                  </div>
                </div>

              </div>
            </Link>
          </section>
        )}

        {/* --- 2. 左图右文列表 (Editorial List Layout) --- */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Explore All Collections</h3>
            <div className="h-px flex-1 bg-slate-200/60 mt-1" />
          </div>

          <div className="flex flex-col gap-6">
            {listCollections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.slug}`} className="group outline-none">
                <div className="flex flex-col sm:flex-row bg-white rounded-[2rem] p-5 sm:p-6 md:p-8 gap-6 md:gap-10 ring-1 ring-black/[0.04] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:ring-black/[0.08] transition-all duration-300">
                  
                  {/* 左侧：文案与数据 */}
                  <div className="flex-1 flex flex-col justify-center py-2">
                    <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors text-balance">
                      {collection.title}
                    </h4>
                    <p className="text-[15px] text-slate-600 font-semibold leading-relaxed mb-3">
                      {collection.tagline}
                    </p>
                    <p className="text-[14px] text-slate-500 font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-6">
                      {collection.description}
                    </p>
                    
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-[13px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md ring-1 ring-black/[0.03]">
                          <BookOpen size={14} className="text-slate-400" />
                          {collection.totalBooks} Books
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md ring-1 ring-black/[0.03]">
                          <Clock size={14} className="text-slate-400" />
                          {collection.totalDuration}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-600">
                        Explore
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>

                  {/* 右侧：1:1 比例的书单封面 */}
                  <div className="relative w-full sm:w-[200px] md:w-[240px] shrink-0 aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] group-hover:-translate-y-1 transition-transform duration-300">
                    <Image 
                      src={collection.coverUrl} 
                      alt={collection.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                </div>
              </Link>
            ))}
          </div>
          
          {/* 加载更多触发器 */}
          {hasMore && (
            <div ref={ref} className="flex justify-center py-12 mt-6">
              {isLoading ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Loading more collections...</span>
                </div>
              ) : (
                <div className="h-12" />
              )}
            </div>
          )}
          
          {/* 已加载完所有 collections */}
          {!hasMore && collections.length > 15 && (
            <div className="text-center py-8 mt-6">
              <p className="text-slate-400 text-sm font-medium">
                You've explored all our collections
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
