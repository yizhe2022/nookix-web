'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { getSlugForGenre } from "@/lib/genre-slugs"

interface Genre {
  id: string
  name: string
  slug?: string
}

interface CategoryGroup {
  category: string
  genres: Genre[]
}

interface CategoriesMenuServerProps {
  initialCategories?: CategoryGroup[]
}

// 分类菜单 - 二级菜单样式
export default function CategoriesMenuServer({ initialCategories = [] }: CategoriesMenuServerProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // 检查当前是否在 genres 页面
  const isActive = pathname.startsWith('/genres')

  const handleGenreClick = () => {
    setIsOpen(false)
    setHoveredCategory(null)
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
                  {initialCategories.length > 0 ? (
                    initialCategories.map((group) => (
                      <div
                        key={group.category}
                        className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                          hoveredCategory === group.category
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHoveredCategory(group.category)}
                      >
                        <span className="text-sm">{group.category}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无分类</div>
                  )}
                </div>
              </div>
            </div>

            {/* 二级菜单 - 显示 genres */}
            {hoveredCategory && (
              <div className="w-64">
                <div className="p-3">
                  <div className="space-y-1">
                    {initialCategories
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
