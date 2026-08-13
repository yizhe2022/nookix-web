'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import { Play, Clock, Crown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import pb from "@/lib/pocketbase"
import { getFileUrl } from "@/lib/pocketbase-service"
import { getAuthorName } from '@/lib/author-utils'


interface SimilarRecommendationsProps {
  bookId: string
  maxItems?: number
}

export default function SimilarRecommendations({ bookId, maxItems = 6 }: SimilarRecommendationsProps) {
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [booksWithDuration, setBooksWithDuration] = useState<any[]>([])

  useEffect(() => {
    const fetchSimilarBooks = async () => {
      try {
        setIsLoading(true)

        // 获取当前书本信息
        const currentBook = await pb.collection('books').getOne(bookId)

        // 基于当前书本的genre和author获取相似书本，且必须是已发布状态
        const filter = `id != "${bookId}" && status = "published" && (genre = "${currentBook.genre || 'General'}" || author = "${currentBook.author}")`

        const result = await pb.collection('books').getList(1, maxItems, {
          sort: '-rating,-created',
          filter,
        })

        if (result.items.length > 0) {
          // 转换PocketBase数据
          const transformedBooks = result.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            author: getAuthorName(item),
            cover: item.cover_image ? getFileUrl(item, item.cover_image) : "/placeholder.svg",
            rating: item.rating || 0,
            duration: item.duration || "Unknown",
            isPremium: item.is_premium || false,
            genre: item.genre || "General",
            audio_duration: item.audio_duration || 0,
            expand: item.expand,
          }))

          setBooks(transformedBooks)
        }
      } catch (error) {
        console.error('Failed to fetch similar books:', error)
        setBooks([])
      } finally {
        setIsLoading(false)
      }
    }

    if (bookId) {
      fetchSimilarBooks()
    }
  }, [bookId, maxItems])

  // 处理书本时长
  useEffect(() => {
    if (!books || books.length === 0) {
      setBooksWithDuration([])
      return
    }

    // 直接处理时长，使用 audio_duration 字段
    const processBooks = () => {
      try {
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
      } catch (error) {
        console.error('处理书本时长失败:', error)
        // 如果处理失败，设置默认时长
        setBooksWithDuration(books.map(book => ({ ...book, calculatedDuration: 'Unknown' })))
      }
    }

    processBooks()
  }, [books])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-[2/3] mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-2 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!booksWithDuration || booksWithDuration.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No similar books found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
      {booksWithDuration.map((book) => (
        <Link key={book.id} href={`/book/${book.slug}`}>
          <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 shadow-sm">
            <CardContent className="p-0">
              <div className="relative w-full aspect-[2/3] mb-2" style={{ aspectRatio: '2/3' }}>
                <Image
                  src={book.cover || "/placeholder.svg"}
                  alt={book.title}
                  fill
                  className="object-fill rounded-t-lg"
                  sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 15vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                  <div className="bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 text-gray-800 fill-current" />
                  </div>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <h3 className="font-medium text-gray-900 text-xs group-hover:text-gray-900 transition-colors line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs line-clamp-1" style={{ color: "#939999" }}>
                  {getAuthorName(book)}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center" style={{ color: "#939999" }}>
                    <Clock className="w-2.5 h-2.5 mr-1" />
                    <span className="text-xs">{book.calculatedDuration || 'Unknown'}</span>
                  </div>
                  <StarRating rating={book.rating} size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
} 