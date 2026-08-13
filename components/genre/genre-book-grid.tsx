"use client"

import { Badge } from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import { Play, Clock, Crown, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import pb from "@/lib/pocketbase"
import { getFileUrl } from "@/lib/pocketbase-service"
import { Card, CardContent } from "@/components/ui/card"
import { getAuthorName } from '@/lib/author-utils'

interface GenreBookGridProps {
  genreName: string
}

export default function GenreBookGrid({ genreName }: GenreBookGridProps) {
  const [books, setBooks] = useState<any[]>([])
  const [booksWithDuration, setBooksWithDuration] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 根据分类名称获取书本数据
  useEffect(() => {
    const fetchBooksByGenre = async () => {
      try {
        setLoading(true)
        console.log('🔍 开始获取分类书本:', genreName)

        // 首先获取分类ID
        const genres = await pb.collection('genres').getFullList({
          filter: `name = "${genreName}"`,
          sort: 'name'
        })

        if (genres.length === 0) {
          console.log(`❌ 未找到分类: ${genreName}`)
          setBooks([])
          return
        }

        const genreId = genres[0].id
        console.log(`✅ 找到分类ID: ${genreId}`)

        // 使用分类ID查询关联的书本
        const records = await pb.collection('books').getFullList({
          filter: `genres ~ "${genreId}" && status = "published"`,
          sort: '-created',
          expand: 'author'
        })

        console.log(`📚 获取到 ${records.length} 本书，分类: ${genreName}`)
        setBooks(records)
      } catch (error) {
        console.error('❌ 获取分类书本失败:', error)
        setBooks([])
      } finally {
        setLoading(false)
      }
    }

    if (genreName) {
      fetchBooksByGenre()
    }
  }, [genreName])

  useEffect(() => {
    if (!books || books.length === 0) {
      setBooksWithDuration([])
      return
    }

    // 直接处理时长，使用 audio_duration 字段
    const processBooks = () => {
      try {
        console.log('🔄 处理书本时长信息...', books.length, '本书')

        const processedBooks = books.map((book) => {
          // 使用 PocketBase 的 audio_duration 字段
          let calculatedDuration = 'Unknown'

          if (book.audio_duration && book.audio_duration > 0) {
            // 将秒数转换为可读格式
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

        setBooksWithDuration(processedBooks)
        console.log('🎉 所有书本时长处理完成')
      } catch (error) {
        console.error('❌ 处理书本时长失败:', error)
        // 如果处理失败，设置默认时长
        setBooksWithDuration(books.map(book => ({ ...book, calculatedDuration: 'Unknown' })))
      }
    }

    processBooks()
  }, [books])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-[2/3] mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!booksWithDuration || booksWithDuration.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found in this genre.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
      {booksWithDuration.map((book) => (
        <Link key={book.id} href={`/book/${book.slug}`}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 shadow-sm">
            <CardContent className="p-0">
              <div className="relative">
                {/* 书本封面 */}
                <div className="relative aspect-[2/3] mb-3 rounded-lg overflow-hidden shadow-sm">
                  <Image
                    src={book.cover_image ? getFileUrl(book, book.cover_image) : "/placeholder.svg"}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-fill"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                      <Play className="w-6 h-6 text-gray-600 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Premium Badge */}
                {book.is_premium && (
                  <div className="absolute top-2 right-2">
                    <Crown className="w-5 h-5 text-yellow-500 fill-current" />
                  </div>
                )}
              </div>

              {/* 书本信息 */}
              <div className="p-4 space-y-2">
                <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-900 transition-colors book-title-focus">
                  {book.title}
                </h3>

                <p className="text-xs line-clamp-1" style={{ color: "#939999" }}>{getAuthorName(book)}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs" style={{ color: "#939999" }}>
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="font-light">{book.calculatedDuration}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs" style={{ color: "#939999" }}>{book.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
