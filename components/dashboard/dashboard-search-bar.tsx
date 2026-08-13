"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, TrendingUp, Book } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  authors: string
  cover_image: string
  rating: number
  ratings_count?: number
  audio_duration?: number
  slug?: string // 添加 slug 字段
}

interface SearchRecommendation {
  id: string
  title: string
  type: "book"
  slug?: string // 添加 slug 字段
}

export default function DashboardSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recommendations, setRecommendations] = useState<SearchRecommendation[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 获取预置推荐（热门书籍）- 从 scenario_selected 表获取
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const supabase = createClient()
        
        console.log('[Search] Fetching recommendations...')
        
        // Step 1: 获取 app_trending_searches 场景
        const { data: scenarioData, error: scenarioError } = await supabase
          .from("scenario_selected")
          .select("id, usage_scenario")
          .eq("usage_scenario", "app_trending_searches")
          .single()

        console.log('[Search] Scenario query result:', { scenarioData, scenarioError })

        if (scenarioError || !scenarioData) {
          console.warn("[Search] No active app_trending_searches scenario found:", scenarioError)
          return
        }

        console.log('[Search] Found scenario:', scenarioData)

        // Step 2: 获取该场景下的书籍
        console.log('[Search] Querying scenario_selected_books with scenario_id:', scenarioData.id)
        
        const { data: booksData, error: booksError } = await supabase
          .from("scenario_selected_books")
          .select("book_id, sort_order")
          .eq("scenario_selected_id", scenarioData.id)
          .order("sort_order", { ascending: true })
          .limit(5)

        console.log('[Search] Books query result:', { 
          booksData, 
          booksError,
          errorDetails: booksError ? JSON.stringify(booksError) : null 
        })

        if (booksError) {
          console.error("[Search] Failed to fetch scenario books:", booksError)
          return
        }

        if (!booksData || booksData.length === 0) {
          console.warn('[Search] No books found for scenario')
          return
        }

        // Step 3: 获取书籍详情（包含 slug）
        const bookIds = booksData.map(item => item.book_id)
        const { data: books, error: booksDetailError } = await supabase
          .from("books")
          .select("id, title, slug, status")
          .in("id", bookIds)
          .eq("status", "published")

        console.log('[Search] Books detail result:', { books, booksDetailError })

        if (booksDetailError || !books) {
          console.error("[Search] Failed to fetch books detail:", booksDetailError)
          return
        }

        // 按 sort_order 排序
        const sortedBooks = books.sort((a, b) => {
          const aOrder = booksData.find(item => item.book_id === a.id)?.sort_order || 0
          const bOrder = booksData.find(item => item.book_id === b.id)?.sort_order || 0
          return aOrder - bOrder
        })

        const recommendations = sortedBooks.map((book) => ({
          id: book.id,
          title: book.title,
          type: "book" as const,
          slug: book.slug, // 添加 slug
        }))

        console.log('[Search] Final recommendations:', recommendations)
        
        setRecommendations(recommendations)
      } catch (error) {
        console.error("[Search] Failed to fetch recommendations:", error)
      }
    }

    fetchRecommendations()
  }, [])

  // 实时搜索（带 debounce）
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const debounceTimer = setTimeout(async () => {
      try {
        const supabase = createClient()
        const queryLower = query.trim().toLowerCase()
        
        // 搜索书名、副标题和作者（模糊搜索，包含 slug）
        const { data, error } = await supabase
          .from("books")
          .select("id, title, subtitle, authors, cover_image, rating, ratings_count, audio_duration, slug")
          .eq("status", "published")
          .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,authors.ilike.%${query}%`)
          .order("rating", { ascending: false })
          .limit(20)

        if (error) throw error

        // 客户端排序：根据匹配字段的权重排序
        const sortedResults = (data || []).sort((a: any, b: any) => {
          // 计算权重分数
          const getScore = (book: any) => {
            let score = 0
            const title = (book.title || '').toLowerCase()
            const subtitle = (book.subtitle || '').toLowerCase()
            const authors = (book.authors || '').toLowerCase()
            
            // title 完全匹配：100分
            if (title === queryLower) score += 100
            // title 开头匹配：50分
            else if (title.startsWith(queryLower)) score += 50
            // title 包含：30分
            else if (title.includes(queryLower)) score += 30
            
            // subtitle 完全匹配：60分
            if (subtitle === queryLower) score += 60
            // subtitle 开头匹配：30分
            else if (subtitle.startsWith(queryLower)) score += 30
            // subtitle 包含：20分
            else if (subtitle.includes(queryLower)) score += 20
            
            // authors 完全匹配：40分
            if (authors === queryLower) score += 40
            // authors 开头匹配：20分
            else if (authors.startsWith(queryLower)) score += 20
            // authors 包含：10分
            else if (authors.includes(queryLower)) score += 10
            
            // 加上评分权重
            score += (book.rating || 0) * 2
            
            return score
          }
          
          return getScore(b) - getScore(a)
        })

        setResults(sortedResults)
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [query])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    inputRef.current?.focus()
  }

  const handleResultClick = (book: SearchResult) => {
    setIsOpen(false)
    setQuery("")
    // 使用 slug
    const bookIdentifier = book.slug
    router.push(`/dashboard/book/${bookIdentifier}`)
  }

  const handleRecommendationClick = (rec: SearchRecommendation) => {
    setIsOpen(false)
    // 使用 slug
    const bookIdentifier = rec.slug
    router.push(`/dashboard/book/${bookIdentifier}`)
  }

  const getCoverUrl = (coverImage: string) => {
    if (!coverImage) return "/placeholder.svg"
    if (coverImage.startsWith("http")) return coverImage
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${coverImage}`
  }

  return (
    <div ref={searchRef} className="relative w-full">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search books and authors..."
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-300 bg-[#FCFAF7] text-sm outline-none focus:outline-none focus:border-blue-500 transition-colors"
          style={{ boxShadow: 'none' }}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 下拉框 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] overflow-y-auto z-50">
          {/* 加载状态 */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2">Searching...</span>
            </div>
          )}

          {/* 搜索结果 */}
          {!isLoading && query && results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Search Results
              </div>
              {results.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleResultClick(book)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-14 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={getCoverUrl(book.cover_image)}
                      alt={book.title}
                      width={40}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{book.authors}</p>
                    {book.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-yellow-500">★</span>
                        <span className="text-xs text-gray-600">{book.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <Book className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* 无结果 */}
          {!isLoading && query && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No books found for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          )}

          {/* 预置推荐（无输入时显示） */}
          {!query && recommendations.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Popular Books
              </div>
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleRecommendationClick(rec)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{rec.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
