"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import ExploreFilters from "@/components/explore/explore-filters"
import ExploreContent from "@/components/explore/explore-content"
import type { ExploreFilters as ExploreFiltersType, ExploreResult } from "@/lib/explore-service"

interface ExplorePageClientProps {
  initialData: ExploreResult | null
  initialFilters: ExploreFiltersType
  initialPage: number
}

export default function ExplorePageClient({ 
  initialData, 
  initialFilters, 
  initialPage 
}: ExplorePageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 使用传入的 initialFilters 初始化 state
  const [filters, setFilters] = useState<ExploreFiltersType>(initialFilters)
  const [currentPage, setCurrentPage] = useState(initialPage)

  // 当 URL 参数变化时更新状态（用于浏览器前进/后退）
  useEffect(() => {
    const newFilters: ExploreFiltersType = {
      searchQuery: searchParams.get('q') || '',
      genres: searchParams.get('genres')?.split(',').filter(Boolean) || [],
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      isPremium: searchParams.get('accessType') === 'premium' ? true :
        searchParams.get('accessType') === 'free' ? false : null,
      sortBy: (searchParams.get('sortBy') as any) || 'latest',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }
    const newPage = Number(searchParams.get('page')) || 1
    
    setFilters(newFilters)
    setCurrentPage(newPage)
  }, [searchParams])

  // 更新URL参数
  const updateURL = (newFilters: ExploreFiltersType, newPage: number = 1) => {
    const params = new URLSearchParams()

    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery)
    if (newFilters.genres && newFilters.genres.length > 0) params.set('genres', newFilters.genres.join(','))
    if (newFilters.minRating) params.set('minRating', newFilters.minRating.toString())
    if (newFilters.isPremium === true) params.set('accessType', 'premium')
    else if (newFilters.isPremium === false) params.set('accessType', 'free')
    else params.set('accessType', 'all')
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy)
    if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder)
    if (newPage > 1) params.set('page', newPage.toString())

    const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.push(newURL, { scroll: false })
  }

  // 处理筛选器更改
  const handleFiltersChange = (newFilters: ExploreFiltersType) => {
    setFilters(newFilters)
    setCurrentPage(1)
    updateURL(newFilters, 1)
  }

  // 处理页面更改
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    updateURL(filters, newPage)
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
      {/* 主要内容区域 */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:pb-[120px]">
        <div className="flex gap-8">
          {/* 左侧筛选栏 - 桌面端显示，移动端隐藏 */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <ExploreFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* 右侧内容区域 - 移动端全宽，桌面端自适应 */}
          <div className="flex-1 lg:flex-1 min-w-0">
            <ExploreContent
              filters={filters}
              currentPage={currentPage}
              onFiltersChange={handleFiltersChange}
              onPageChange={handlePageChange}
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
