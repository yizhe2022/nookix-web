"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getRecommendedBlogs, getAllBlogTags } from '@/lib/supabase-service'
import { getFileUrl } from '@/lib/pocketbase-service'
import type { Book } from '@/lib/types'
import { tagToSlug } from '@/lib/slug-utils'
import { getAuthorName } from '@/lib/author-utils'

interface BlogSidebarProps {
  currentBlog?: {
    id: string
    title: string
    slug?: string
    publishDate: string
    bookCount: number
    image: string
    content: string
    description?: string
    status?: string
    tags?: string[]
  }
  popularBooks?: any[]
}

export default function BlogSidebar({ currentBlog, popularBooks: initialPopularBooks }: BlogSidebarProps) {
  const [recommendedBlogs, setRecommendedBlogs] = useState<any[]>([])
  const [popularBooks, setPopularBooks] = useState<Book[]>(initialPopularBooks || [])
  const [allBlogTags, setAllBlogTags] = useState<string[]>([])

  // 获取基于 tags 的推荐 blogs
  useEffect(() => {
    if (currentBlog?.tags && currentBlog.tags.length > 0) {
      fetchRecommendedBlogs(currentBlog.tags, currentBlog.id)
    }
  }, [currentBlog])

  // 获取所有 blog 的 tags
  useEffect(() => {
    fetchAllBlogTags()
  }, [])

  const fetchRecommendedBlogs = async (tags: string[], currentId: string) => {
    try {
      const blogs = await getRecommendedBlogs(tags, currentId, 5)
      if (blogs.length > 0) {
        setRecommendedBlogs(blogs)
      }
    } catch (error) {
      console.error('Failed to fetch recommended blogs:', error)
    }
  }

  const fetchAllBlogTags = async () => {
    try {
      const tags = await getAllBlogTags()
      setAllBlogTags(tags)
    } catch (error) {
      console.error('Failed to fetch all blog tags:', error)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-0">
      {/* Related Blogs - 放在第一位 */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Related Blogs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendedBlogs.length > 0 ? (
            recommendedBlogs.map((blog: any) => (
              <Link key={blog.id} href={`/blog/${blog.slug}`}>
                <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={blog.image || "/placeholder.svg"}
                      alt={blog.title}
                      fill
                      sizes="64px"
                      className="object-fill rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{blog.title}</h4>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No related blogs found</p>
          )}
        </CardContent>
      </Card>

      {/* Popular Books - 放在第二位，显示12本书 */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Popular Books</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {popularBooks.map((book: Book) => (
            <Link key={book.id} href={`/book/${book.slug}`}>
              <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="relative w-12 h-[72px] flex-shrink-0">
                  <Image
                  src={book.cover_image ? getFileUrl({ ...book, collectionName: book.collectionName || 'books', collectionId: book.collectionId || '' }, book.cover_image) : "/placeholder.svg"}
                  alt={book.title}
                  fill
                  sizes="48px"
                  className="object-fill rounded-md"
                />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">{book.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-1">{getAuthorName(book)}</p>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* All Blog Tags - 替换原来的 Related Matches */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">All Blog Tags</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {allBlogTags.length > 0 ? (
            allBlogTags.map((tag: string) => (
              <Link key={tag} href={`/blog/${tagToSlug(tag)}`}>
                <span className="px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                  # {tag}
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4 w-full">No tags available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
