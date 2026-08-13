"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Star, Clock, Play, Crown, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { searchBooks, type ExploreFilters, type ExploreResult } from "@/lib/explore-service"
import pb from "@/lib/pocketbase"
import { getFileUrl } from "@/lib/pocketbase-service"
import type { Book } from "@/lib/types"
import { getAuthorName } from '@/lib/author-utils'

interface ExploreContentProps {
  filters: ExploreFilters
  currentPage: number
  onFiltersChange: (filters: ExploreFilters) => void
  onPageChange: (page: number) => void
  initialData?: ExploreResult | null
}

// 处理书籍时长计算
const processBooksWithDuration = (books: Book[]): (Book & { calculatedDuration: string })[] => {
  return books.map(book => {
    let calculatedDuration = 'Unknown'

    if (book.audio_duration && book.audio_duration > 0) {
      const totalMinutes = Math.ceil(book.audio_duration / 60)
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        if (minutes > 0) {
          calculatedDuration = `${hours}h ${minutes}min`
        } else {
          calculatedDuration = `${hours}h`
        }
      } else {
        calculatedDuration = `${totalMinutes}min`
      }
    }

    return {
      ...book,
      calculatedDuration
    }
  })
}

export default function ExploreContent({
  filters,
  currentPage,
  onFiltersChange,
  onPageChange,
  initialData
}: ExploreContentProps) {
  // 使用 initialData 初始化状态，如果有的话
  const [searchResults, setSearchResults] = useState<ExploreResult>(
    initialData || {
      books: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  )
  const [loading, setLoading] = useState(!initialData)
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '')
  const [booksWithDuration, setBooksWithDuration] = useState<(Book & { calculatedDuration: string })[]>(
    initialData?.books ? processBooksWithDuration(initialData.books) : []
  )
  // 使用 ref 来跟踪是否已经执行过初始搜索
  const hasInitialSearchRef = useRef(false)

  // 执行搜索
  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await searchBooks(filters, { page: currentPage, limit: 50 })
      setSearchResults(result)
      setBooksWithDuration(processBooksWithDuration(result.books))
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage])

  // 当筛选器或页面变化时重新搜索
  // 初始渲染时如果已经有 initialData，跳过搜索
  useEffect(() => {
    // 如果已经有 initialData 且是第一次渲染，使用 initialData，不执行搜索
    if (initialData && !hasInitialSearchRef.current) {
      hasInitialSearchRef.current = true
      
      // 确保 loading 状态为 false（因为已经有数据）
      if (loading) {
        setLoading(false)
      }
      return
    }
    
    // 对于没有 initialData 的情况，或者 filters/currentPage 变化的情况，执行搜索
    // 使用 hasInitialSearchRef 来避免重复执行初始搜索
    if (!hasInitialSearchRef.current) {
      hasInitialSearchRef.current = true
      performSearch()
      return
    }
    
    // 后续 filters 或 currentPage 变化时执行搜索
    performSearch()
  }, [filters, currentPage])

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFiltersChange({
      ...filters,
      searchQuery: searchInput
    })
  }

  // 清除搜索
  const handleClearSearch = () => {
    setSearchInput('')
    onFiltersChange({
      ...filters,
      searchQuery: ''
    })
  }

  // 获取书本封面URL
  const getBookCoverUrl = (book: Book) => {
    if (book.cover_image) {
      try {
        const record = {
          ...book,
          collectionName: book.collectionName || 'books',
          collectionId: book.collectionId || '',
        }
        return getFileUrl(record, book.cover_image)
      } catch (error) {
        return '/placeholder.svg'
      }
    }
    return '/placeholder.svg'
  }

  // 格式化时长
  const formatDuration = (duration: string) => {
    if (!duration) return ''
    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (match) {
      const hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    }
    return duration
  }

  // 获取结果显示文本
  const getResultsText = () => {
    const hasFilters = filters.isPremium !== null ||
      (filters.minRating && filters.minRating > 0) ||
      (filters.genres && filters.genres.length > 0)
    const hasSearch = filters.searchQuery && filters.searchQuery.trim() !== ''

    if (hasFilters || hasSearch) {
      const count = searchResults.totalItems ?? 0
      return count === 1 ? '1 Result' : `${count} Results`
    }

    return 'All books'
  }

  // 提取分页所需的变量
  const { totalPages, hasPrevPage, hasNextPage } = searchResults

  // 生成要显示的页码逻辑
  const getPageNumbers = () => {
    const pages = []

    if (totalPages <= 1) return []

    // 总是显示第一页
    pages.push(1)

    // 计算当前页周围的页码范围
    let rangeStart = Math.max(2, currentPage - 1)
    let rangeEnd = Math.min(totalPages - 1, currentPage + 1)

    // 调整范围以尽可能显示3页
    if (rangeEnd - rangeStart < 2) {
      if (rangeStart === 2) {
        rangeEnd = Math.min(totalPages - 1, rangeStart + 2)
      } else if (rangeEnd === totalPages - 1) {
        rangeStart = Math.max(2, rangeEnd - 2)
      }
    }

    // 如果需要在第一页后添加省略号
    if (rangeStart > 2) {
      pages.push("ellipsis1")
    }

    // 添加范围页面
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }

    // 如果需要在最后一页前添加省略号
    if (rangeEnd < totalPages - 1) {
      pages.push("ellipsis2")
    }

    // 如果超过一页，总是显示最后一页
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="space-y-6">
      {/* Book Finder Hub 标题 */}
      <h2 className="text-xl font-bold text-gray-900">Book Finder Hub</h2>

      {/* 搜索框 - 移动端现在也是单行显示 */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-12 text-base pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            className="h-12 px-4 sm:px-6 bg-black text-white hover:bg-gray-800 shrink-0"
          >
            Search
          </Button>
        </form>
      </div>

      {/* 搜索结果统计 */}
      <div className="mb-6">
        <p className="text-gray-900 font-medium">
          {loading ? 'Searching...' : getResultsText()}
        </p>
      </div>

      {/* 书本网格 - 移动端2列，桌面端4列布局 -> 改为更密集的布局 */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
          {[...Array(20)].map((_, i) => (
            <Card key={i} className="border border-gray-100 shadow-sm animate-pulse">
              <CardContent className="p-0">
                <div className="relative aspect-[2/3] mb-3 bg-gray-200 rounded-t-lg" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchResults.books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books found matching your criteria</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
          {booksWithDuration.map((book) => (
            <Link key={book.id} href={`/book/${book.slug}`}>
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 shadow-sm h-full">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="relative flex-shrink-0">
                    <div className="relative aspect-[2/3]">
                      <Image
                        src={getBookCoverUrl(book)}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-fill rounded-t-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder.svg'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 rounded-full p-3 shadow-lg">
                          <Play className="w-6 h-6 text-gray-600 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-900 transition-colors line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-xs line-clamp-1 text-gray-500">{getAuthorName(book)}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDuration(book.calculatedDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-500">{(book.rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 分页器 - 防止溢出导致自动换行 */}
      <div className="mb-[120px] pb-4">
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevPage}
            onClick={() => onPageChange(currentPage - 1)}
            className="text-gray-600"
          >
            Previous
          </Button>

          {pageNumbers.map((page, index) => {
            if (page === "ellipsis1" || page === "ellipsis2") {
              return (
                <Button key={`ellipsis-${index}`} variant="ghost" size="sm" disabled className="cursor-default">
                  ...
                </Button>
              )
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={currentPage === page ? "bg-black text-white" : "text-gray-600"}
              >
                {page}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="text-gray-600"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
