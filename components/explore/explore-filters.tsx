"use client"

import { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { getAvailableGenres, type ExploreFilters } from "@/lib/explore-service"

interface ExploreFiltersProps {
  filters: ExploreFilters
  onFiltersChange: (filters: ExploreFilters) => void
}

export default function ExploreFilters({ filters, onFiltersChange }: ExploreFiltersProps) {
  const [availableGenres, setAvailableGenres] = useState<{title: string, slug: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [ratingValue, setRatingValue] = useState([filters.minRating || 0])

  // 获取可用的分类列表
  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true)
      try {
        const genres = await getAvailableGenres()
        setAvailableGenres(genres)
      } catch (error) {
        console.error('获取分类列表失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGenres()
  }, [])

  // 处理Access Type更改 - 使用单选逻辑
  const handleAccessTypeChange = (accessType: string) => {
    let isPremium: boolean | null = null
    if (accessType === 'premium') isPremium = true
    else if (accessType === 'free') isPremium = false
    
    onFiltersChange({
      ...filters,
      isPremium
    })
  }

  // 处理最低评分更改
  const handleRatingChange = (value: number[]) => {
    setRatingValue(value)
    onFiltersChange({
      ...filters,
      minRating: value[0] === 0 ? undefined : value[0]
    })
  }

  // 处理分类选择更改
  const handleGenreToggle = (genreTitle: string, checked: boolean) => {
    const currentGenres = filters.genres || []
    let newGenres: string[]
    
    if (checked) {
      newGenres = [...currentGenres, genreTitle]
    } else {
      newGenres = currentGenres.filter(g => g !== genreTitle)
    }
    
    onFiltersChange({
      ...filters,
      genres: newGenres
    })
  }

  // 获取当前Access Type值
  const getCurrentAccessType = () => {
    if (filters.isPremium === true) return 'premium'
    if (filters.isPremium === false) return 'free'
    return 'all'
  }

  // 获取评分显示文本
  const getRatingText = () => {
    const rating = ratingValue[0]
    if (rating === 0) return 'Any Rating'
    return `${rating}+ stars`
  }

  // 检查是否有筛选条件
  const hasActiveFilters = () => {
    return filters.isPremium !== null || 
           (filters.minRating && filters.minRating > 0) ||
           (filters.genres && filters.genres.length > 0)
  }

  // 清除所有筛选条件
  const handleClearAll = () => {
    setRatingValue([0])
    onFiltersChange({
      isPremium: null,
      minRating: undefined,
      genres: []
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters 标题和Clear All按钮 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-blue-600 hover:bg-blue-50 p-0 h-auto font-normal"
          >
            Clear all
          </Button>
        )}
      </div>
      
      {/* Access Type 模块 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Type</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="all-books"
              name="access-type"
              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
              checked={getCurrentAccessType() === "all"}
              onChange={() => handleAccessTypeChange("all")}
            />
            <Label htmlFor="all-books" className="text-base text-gray-900 font-medium">
              All Books
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="free-books"
              name="access-type"
              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
              checked={getCurrentAccessType() === "free"}
              onChange={() => handleAccessTypeChange("free")}
            />
            <Label htmlFor="free-books" className="text-base text-gray-900">
              Free Books
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="premium-only"
              name="access-type"
              className="w-4 h-4 text-black border-gray-300 focus:ring-black"
              checked={getCurrentAccessType() === "premium"}
              onChange={() => handleAccessTypeChange("premium")}
            />
            <Label htmlFor="premium-only" className="text-base text-gray-900">
              Premium Only
            </Label>
          </div>
        </div>
      </div>

      {/* Minimum Rating 模块 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Minimum Rating</h3>
        <div className="space-y-4">
          <div className="px-2">
            <Slider
              value={ratingValue}
              onValueChange={handleRatingChange}
              max={5}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>0</span>
            <span className="font-medium">{getRatingText()}</span>
            <span>5</span>
          </div>
        </div>
      </div>

      {/* Genres 模块 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Genres</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {availableGenres.map((genre) => (
              <div key={genre.slug} className="flex items-center space-x-3">
                <Checkbox 
                  id={`genre-${genre.slug}`}
                  checked={filters.genres?.includes(genre.title) || false}
                  onCheckedChange={(checked) => handleGenreToggle(genre.title, checked as boolean)}
                  className="w-4 h-4"
                />
                <Label htmlFor={`genre-${genre.slug}`} className="text-base text-gray-900 cursor-pointer">
                  {genre.title}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 