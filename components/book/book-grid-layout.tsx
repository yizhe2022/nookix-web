"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import { Play, Clock, Crown, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import pb from "@/lib/pocketbase"
import { getFileUrl } from "@/lib/pocketbase-service"
import { getAuthorName } from '@/lib/author-utils'

interface BookGridLayoutProps {
  booksPerRow?: number
  removeBorder?: boolean
  roundedCovers?: boolean
  bookFilter?: string
  maxItems?: number
  selectedBooks?: string[]
  filterQuery?: string
  initialBooks?: any[]
}

export default function BookGridLayout({
  booksPerRow = 5,
  removeBorder = false,
  roundedCovers = false,
  bookFilter,
  maxItems,
  selectedBooks,
  filterQuery,
  initialBooks,
}: BookGridLayoutProps) {
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [booksWithDuration, setBooksWithDuration] = useState<any[]>([])

  useEffect(() => {
    const fetchBooks = async () => {
      // ✅ ZFR (Zero-Flash Rendering): If server provided books, skip client fetch entirely
      if (initialBooks && initialBooks.length > 0) {
        let transformedBooks = initialBooks.map((item: any) => ({
          id: item.id,
          title: item.title,
          author: getAuthorName(item),
          narrator: item.narrator || getAuthorName(item),
          cover: item.cover_image ? getFileUrl(item, item.cover_image) : (item.cover || "/placeholder.svg"),
          rating: item.rating || 0,
          duration: item.duration || "Unknown",
          isPremium: item.is_premium || false,
          genre: item.genre || "General",
          audio_duration: item.audio_duration || 0,
          expand: item.expand,
        }));

        if (maxItems && transformedBooks.length > maxItems) {
          transformedBooks = transformedBooks.slice(0, maxItems);
        }
        setBooks(transformedBooks);
        setIsLoading(false);
        return;
      }

      try {
        let transformedBooks: any[] = []

        // 如果有手工选择的书本ID列表，优先使用
        if (selectedBooks && selectedBooks.length > 0) {
          // 获取指定ID的书本
          console.log('📚 BookGridLayout: Fetching selected books:', selectedBooks);
          const bookPromises = selectedBooks.map(async (bookId) => {
            try {
              const book = await pb.collection('books').getOne(bookId)
              return {
                id: book.id,
                title: book.title,
                author: getAuthorName(book),
                narrator: book.narrator || getAuthorName(book), // 如果没有朗读者信息，使用作者
                cover: book.cover_image ? getFileUrl(book, book.cover_image) : "/placeholder.svg",
                rating: book.rating || 0,
                duration: book.duration || "Unknown",
                isPremium: book.is_premium || false,
                genre: book.genre || "General",
                audio_duration: book.audio_duration || 0,
                status: book.status // Add status for debugging
              }
            } catch (error) {
              console.error(`Failed to fetch book ${bookId}:`, error)
              return null
            }
          })

          const fetchedBooks = await Promise.all(bookPromises)
          console.log('📚 BookGridLayout: Fetched raw books:', fetchedBooks);
          transformedBooks = fetchedBooks.filter(book => book !== null)
          console.log('📚 BookGridLayout: Transformed books (before limit):', transformedBooks);

          // 按照selectedBooks的顺序排列
          transformedBooks.sort((a, b) => {
            const indexA = selectedBooks.indexOf(a.id)
            const indexB = selectedBooks.indexOf(b.id)
            return indexA - indexB
          })

          // 限制数量
          if (maxItems && transformedBooks.length > maxItems) {
            transformedBooks = transformedBooks.slice(0, maxItems)
          }
        } else {
          // 使用原有的筛选逻辑
          const options: any = {
            sort: bookFilter || '-created',
            filter: filterQuery || '',
          }

          // 获取数据，限制数量
          // Fix: booksPerRow=5 now maps to 6 columns, so we need to fetch at least 6 items
          // Logic: if booksPerRow is the default "5" (which is density level), display is 6 col.
          // Adjust limit to be booksPerRow + 1 (or just use 6 if it's 5)
          const actualCols = booksPerRow === 5 ? 6 : booksPerRow === 6 ? 7 : booksPerRow;
          const limit = maxItems || actualCols || 15
          options.expand = 'genres'
          const result = await pb.collection('books').getList(1, limit, options)

          if (result.items.length > 0) {
            // 转换PocketBase数据
            transformedBooks = result.items.map((item: any) => ({
              id: item.id,
              title: item.title,
              author: getAuthorName(item),
              narrator: item.narrator || getAuthorName(item),
              cover: item.cover_image ? getFileUrl(item, item.cover_image) : "/placeholder.svg",
              rating: item.rating || 0,
              duration: item.duration || "Unknown",
              isPremium: item.is_premium || false,
              genre: item.genre || "General",
              audio_duration: item.audio_duration || 0,
              expand: item.expand,
            }))
          }
        }

        if (transformedBooks.length > 0) {
          setBooks(transformedBooks)
        }
      } catch (error) {
        console.error('Failed to fetch books:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [bookFilter, maxItems, booksPerRow, selectedBooks, filterQuery, initialBooks])

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

  const gridCols = {
    3: "grid-cols-1 sm:grid-cols-3 lg:grid-cols-4",
    4: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
    5: "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
    6: "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7",
  }

  if (isLoading) {
    const skeletonCount = maxItems || (booksPerRow === 5 ? 6 : booksPerRow);
    return (
      <div className={`grid ${gridCols[booksPerRow as keyof typeof gridCols]} gap-6`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} className={`border-0 shadow-none`}>
            <CardContent className="p-0">
              <div className="relative aspect-[2/3] mb-3 bg-muted rounded-lg animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse mt-2"></div>
                <div className="flex items-center justify-between mt-4">
                  <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-8 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid ${gridCols[booksPerRow as keyof typeof gridCols]} gap-6`}>
      {booksWithDuration.map((book, index) => (
        <Link key={book.id} href={`/book/${book.slug}`}>
          <Card
            className={`group cursor-pointer hover:shadow-lg transition-all duration-300 ${removeBorder ? "border-0 shadow-none hover:shadow-md" : "border border-gray-100 shadow-sm"}`}
          >
            <CardContent className="p-0">
              <div className="relative">
                <div
                  className={`relative mb-3 ${roundedCovers ? "rounded-lg overflow-hidden" : ""}`}
                  style={{ aspectRatio: '2/3', contain: 'layout' }}
                >
                  <Image
                    src={book.cover || "/placeholder.svg"}
                    alt={`Book cover of ${book.title}`}
                    fill
                    className={`object-cover ${roundedCovers ? "" : "rounded-t-lg"}`}
                    // 移动端优化：减少同时加载的图片数量
                    priority={index < 4} // 只优先加载前4本书
                    loading={index < 4 ? "eager" : "lazy"}
                    // 优化 sizes 属性，移动端使用更小的尺寸
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1200px) 20vw, 16vw"
                    quality={70} // 降低图片质量以减小体积
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg">
                      <Play className="w-6 h-6 text-gray-600 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-900 transition-colors book-title-focus">
                    {book.title}
                  </h3>

                  <p className="text-xs line-clamp-1" style={{ color: "#939999" }}>{getAuthorName(book)}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs" style={{ color: "#939999" }}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{book.calculatedDuration || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs" style={{ color: "#939999" }}>{book.rating.toFixed(1)}</span>
                    </div>
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
