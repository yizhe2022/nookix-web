"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getReadingHistory } from "@/lib/library-service"
import Image from "next/image"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight } from "lucide-react"

interface Book {
  id: string
  slug?: string
  title: string
  author: string
  cover?: string
  rating: number
  duration?: string
  progress?: number
  last_read_at?: string
}

export default function ContinueReadingSection() {
  const { user, accessToken } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchContinueReading = async () => {
      if (!user || !accessToken) {
        setIsLoading(false)
        return
      }

      try {
        const result = await getReadingHistory(user.id, accessToken, 100)
        
        if (result.success) {
          // 获取有进度的书籍，按最后阅读时间排序，取前3本
          const recentBooks = result.data
            .filter(book => book.progress && book.progress > 0)
            .sort((a, b) => {
              return new Date(b.last_read_at || 0).getTime() - new Date(a.last_read_at || 0).getTime()
            })
            .slice(0, 3)

          setBooks(recentBooks)
        }
      } catch (error) {
        console.error("Failed to fetch continue reading:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContinueReading()
  }, [accessToken, user])

  // 如果没有用户或没有书籍，不显示这个模块
  if (!user || (!isLoading && books.length === 0)) {
    return null
  }

  if (isLoading) {
    return (
      <div className="mb-12 lg:mb-16">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex bg-white rounded-lg overflow-hidden">
              <Skeleton className="w-24 h-36" />
              <div className="flex-1 p-3 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-24 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12 lg:mb-16">
      {/* 标题和快捷入口 */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-gray-900">Continue Reading</h2>
        <Link
          href="/dashboard/library"
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* 书籍列表 - 白色背景，封面贴边 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* 书本封面 - 左侧贴边，右侧直角 */}
            <Link 
              href={`/dashboard/book/${book.slug}`}
              className="relative flex-shrink-0 w-24 bg-gray-100 hover:opacity-90 transition-opacity" 
              style={{ aspectRatio: '2/3' }}
            >
              <Image
                src={
                  book.cover?.startsWith("http")
                    ? book.cover
                    : book.cover
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${book.cover}`
                    : "/placeholder.svg"
                }
                alt={book.title}
                fill
                unoptimized
                className="object-cover"
              />
            </Link>

            {/* 书本信息 - 右侧内容区有内边距 */}
            <div className="flex-1 min-w-0 flex flex-col p-3">
              <Link 
                href={`/dashboard/book/${book.slug}`}
                className="hover:text-blue-600 transition-colors"
              >
                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                  {book.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">{book.author}</p>
              
              {/* Continue Reading 按钮 - 更紧凑 */}
              <Link
                href={`/dashboard/book/${book.slug}`}
                className="mt-auto inline-flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors self-start"
              >
                Continue
                {book.progress !== undefined && book.progress !== null && (
                  <span className="ml-1">· {Math.round(book.progress)}%</span>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
