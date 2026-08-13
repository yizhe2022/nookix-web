'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import pb from '@/lib/pocketbase'
import { getRecommendedBooks, getFileUrl } from '@/lib/pocketbase-service'
import type { Book } from '@/lib/types'
import { getAuthorName } from '@/lib/author-utils'


interface BookDetailSidebarProps {
  bookId: string
  popularBooks: Book[]
  genres: { title: string, slug: string }[]
}

import { getSlugForGenre } from "@/lib/genre-slugs"

/**
 * 书本详情侧边栏组件
 * 包含 Popular Books、Browse by Genres 两个模块
 */
export default function BookDetailSidebar({ bookId, popularBooks: initialPopularBooks, genres: initialGenres }: BookDetailSidebarProps) {
  const [popularBooks, setPopularBooks] = useState<Book[]>(initialPopularBooks || [])
  const [genres, setGenres] = useState<{ title: string, slug: string }[]>(initialGenres || [])
  const router = useRouter()

  // 移除客户端数据获取逻辑，改为使用服务端传入的数据

  const handleGenreClick = (genreTitle: string) => {
    const slug = getSlugForGenre(genreTitle)
    router.push(`/genres/${slug}`) // 更新路径为/genres/
  }

  // 获取书本封面URL的辅助函数
  const getCoverUrl = (book: Book) => {
    if (book.cover_image) {
      try {
        // 确保 book 对象包含 collectionName，如果没有则手动添加
        const bookWithCollection = {
          ...book,
          collectionName: book.collectionName || 'books',
          collectionId: book.collectionId || book.id
        }
        return getFileUrl(bookWithCollection, book.cover_image)
      } catch (error) {
        console.error('Failed to get cover URL:', error)
        return '/placeholder.svg'
      }
    }
    return '/placeholder.svg'
  }



  return (
    <div className="space-y-3 md:space-y-8">
      {/* Popular Books - 与series页面样式一致 */}
      {/* Popular Books - 与series页面样式一致 */}
      <Card className="shadow-none border-0 bg-transparent">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Popular Books</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 space-y-4">
          {popularBooks.map((book: Book) => (
            <Link key={book.id} href={`/book/${book.slug}`}>
              <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="relative w-12 h-[72px] flex-shrink-0">
                  <Image
                    src={getCoverUrl(book)}
                    alt={`Cover image for ${book.title}`}
                    fill
                    sizes="48px"
                    className="object-fill rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder.svg'
                    }}
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

      {/* Browse by Genres */}
      {/* Browse by Genres */}
      <Card className="shadow-none border-0 bg-transparent">
        <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Browse by Genres</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="flex flex-wrap gap-2">
            {genres.filter((tag, index, self) =>
              index === self.findIndex((t) => t.slug === tag.slug)
            ).map((genre) => (
              <Badge
                key={genre.slug}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                onClick={() => handleGenreClick(genre.title)}
              >
                {genre.title}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 