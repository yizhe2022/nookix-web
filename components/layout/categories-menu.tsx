"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { getCategoriesWithGenres, type CategoryGroup } from "@/lib/supabase-service"
import { getSlugForGenre } from "@/lib/genre-slugs"

export default function CategoriesMenu() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)

  // 检查当前是否在 genres 页面
  const isActive = pathname.startsWith('/genres')

  useEffect(() => {
    const fetchCategoriesAndGenres = async () => {
      try {
        console.log('🔍 [CategoriesMenu] 开始获取 categories 和 genres 数据...')
        const data = await getCategoriesWithGenres()
        console.log('✅ [CategoriesMenu] 获取到数据:', data)
        setCategories(data)
      } catch (error) {
        console.error('❌ [CategoriesMenu] Error fetching categories and genres:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoriesAndGenres()
  }, [])

  const handleGenreClick = () => {
    setIsOpen(false)
    setHoveredCategory(null)
  }

  if (loading) {
    return (
      <div className="relative">
        <button className={`flex items-center space-x-1 text-sm font-normal transition-colors ${
          isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
        }`}>
          <span>Categories</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button 
        className={`flex items-center space-x-1 text-sm font-normal transition-colors ${
          isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle categories menu"
      >
        <span>Categories</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex">
            {/* 一级菜单 - 显示 categories */}
            <div className="w-64 border-r border-gray-200">
              <div className="p-3">
                <div className="space-y-1">
                  {categories.map((categoryGroup) => (
                    <div
                      key={categoryGroup.category}
                      className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                        hoveredCategory === categoryGroup.category
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onMouseEnter={() => setHoveredCategory(categoryGroup.category)}
                    >
                      <span className="text-sm">{categoryGroup.category}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 二级菜单 - 显示 genres */}
            {hoveredCategory && (
              <div className="w-64">
                <div className="p-3">
                  <div className="space-y-1">
                    {categories
                      .find(group => group.category === hoveredCategory)
                      ?.genres.map((genre) => (
                        <Link
                          key={genre.id}
                          href={`/genres/${getSlugForGenre(genre.name)}`}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          onClick={handleGenreClick}
                        >
                          {genre.name}
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 点击外部关闭菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false)
            setHoveredCategory(null)
          }}
        />
      )}
    </div>
  )
} 