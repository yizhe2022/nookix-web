"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getAllBlogs } from "@/lib/supabase-service"
import { createIdSlug } from '@/lib/slug-utils'

const ITEMS_PER_PAGE = 20

interface BlogGridProps {
  selectedTag?: string;
}

export default function BlogGrid({ selectedTag }: BlogGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [blogs, setBlogs] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch blogs data from Supabase
  const fetchBlogs = async (page: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const { blogs: fetchedBlogs, totalPages: pages } = await getAllBlogs(page, ITEMS_PER_PAGE, selectedTag)

      if (fetchedBlogs.length > 0) {
        // Transform Supabase data to match component expectations
        const transformedBlogs = fetchedBlogs.map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.name,
          cover: item.cover_image || "/placeholder.svg",
          publishDate: item.published_date || item.created_at,
          description: item.seo_description,
          status: item.status || "published",
        }))
        setBlogs(transformedBlogs)
        setTotalPages(pages)
      } else {
        setBlogs([])
        setTotalPages(1)
      }
    } catch (err) {
      console.error('Failed to fetch blogs data:', err)
      setError('Failed to fetch blogs data')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on page change
  useEffect(() => {
    fetchBlogs(currentPage)
  }, [currentPage, selectedTag])

  // 当标签改变时重置到第一页
  useEffect(() => {
    if (selectedTag) {
      setCurrentPage(1)
    }
  }, [selectedTag])

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  return (
    <section className={selectedTag ? "" : "pb-16 sm:pb-24"} style={{ backgroundColor: "#FAFAF9" }}>
      {/* --- Header 区域 --- */}
      {!selectedTag && (
        <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/60 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-[1024px] mx-auto px-6 sm:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-blue-200/60 bg-blue-50 mb-6">
              <Sparkles size={12} className="text-blue-600" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-blue-600">
                Insights & Ideas
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Best ideas through the power{' '}<br className="hidden md:block" />
              <span className="text-slate-400">of good audiobooks.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
              Articles, book deep-dives, and behind-the-scenes insights on the advantages of audiobooks for learning, plus bridging academic theory with real-world startup building.
            </p>
          </div>
        </section>
      )}
      
      <div className={selectedTag ? "" : "max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8"}>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading blogs...</span>
          </div>
        ) : (
          <>
            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {blogs.map((blogItem) => (
                <Link key={blogItem.id} href={`/blog/${blogItem.slug}`}>
                  <Card className="group cursor-pointer hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 border-0 ring-1 ring-black/[0.04] hover:ring-black/[0.08] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] h-full flex flex-col rounded-2xl">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative aspect-[3/2] mb-4">
                        <Image
                          src={blogItem.cover || "/placeholder.svg"}
                          alt={`Blog cover of ${blogItem.title}`}
                          fill
                          priority={blogItem.id === blogs[0]?.id}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-fill rounded-t-2xl"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors rounded-t-2xl"></div>
                      </div>

                      <div className="p-4 space-y-3 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 min-h-[2.5rem] tracking-tight group-hover:text-blue-600 transition-colors">{blogItem.title}</h3>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mt-auto">
                          <span>
                            {blogItem.publishDate ?
                              new Date(blogItem.publishDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                              : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
