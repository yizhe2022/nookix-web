"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getAdjacentBlogs } from '@/lib/supabase-service'

interface BlogNavigationProps {
  currentBlogId: string
}

interface BlogItem {
  id: string
  name: string
  slug: string
  cover_image: string
}

/**
 * Blog 详情页的上一篇/下一篇导航组件
 * Previous: 更晚发布的 blog（时间更晚）
 * Next: 更早发布的 blog（时间更早）
 */
export default function BlogNavigation({ currentBlogId }: BlogNavigationProps) {
  const [previousBlog, setPreviousBlog] = useState<BlogItem | null>(null)
  const [nextBlog, setNextBlog] = useState<BlogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAdjacentBlogs()
  }, [currentBlogId])

  const fetchAdjacentBlogs = async () => {
    try {
      setIsLoading(true)
      const { previous, next } = await getAdjacentBlogs(currentBlogId)
      setPreviousBlog(previous)
      setNextBlog(next)
    } catch (error) {
      console.error('Failed to fetch adjacent blogs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center text-gray-500">Loading navigation...</div>
      </div>
    )
  }

  // 如果没有上一篇和下一篇，不显示导航
  if (!previousBlog && !nextBlog) {
    return null
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="grid grid-cols-2 gap-4">
        {/* Previous Blog - 更晚发布的 blog */}
        <div className="flex justify-start">
          {previousBlog ? (
            <Link href={`/blog/${previousBlog.slug}`} className="group">
              <div className="hover:bg-gray-50 transition-all duration-200 p-4 rounded-lg max-w-sm">
                <div className="flex items-center space-x-3">
                  <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={previousBlog.cover_image || "/placeholder.svg"}
                      alt={previousBlog.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="min-w-0 flex-1 max-w-[200px]">
                    <p className="text-xs text-gray-500 mb-1">Previous Blog</p>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {previousBlog.name}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>

        {/* Next Blog - 更早发布的 blog */}
        <div className="flex justify-end">
          {nextBlog ? (
            <Link href={`/blog/${nextBlog.slug}`} className="group">
              <div className="hover:bg-gray-50 transition-all duration-200 p-4 rounded-lg max-w-sm">
                <div className="flex items-center space-x-3">
                  <div className="min-w-0 flex-1 text-right max-w-[200px]">
                    <p className="text-xs text-gray-500 mb-1">Next Blog</p>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {nextBlog.name}
                    </p>
                  </div>
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={nextBlog.cover_image || "/placeholder.svg"}
                      alt={nextBlog.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded"
                    />
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  )
}
