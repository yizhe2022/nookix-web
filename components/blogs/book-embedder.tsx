"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Clock, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getBookBySlug } from '@/lib/supabase-service'

interface BookEmbedderProps {
  title?: string
  author?: string
  rating?: number
  duration?: string
  cover?: string
  bookId: string
  isPremium?: boolean
  genre?: string
  layout?: 'list' | 'focus' | 'stream' | 'grid' | string
}

const getCoverUrl = (coverImage: string) => {
  if (!coverImage) return "/placeholder.svg"
  if (coverImage.startsWith("http")) return coverImage
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${coverImage}`
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return "30min"
  const minutes = Math.ceil(seconds / 60)

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return `${minutes}min`
}

export default function BookEmbedder({
  title = '',
  author = '',
  rating = 0,
  cover = '',
  bookId,
  layout = 'list'
}: BookEmbedderProps) {
  const [bookData, setBookData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const record = await getBookBySlug(bookId)

        if (!record) {
          setBookData(null)
          setIsLoading(false)
          return
        }

        setBookData(record)
      } catch (error) {
        console.error(`[BookEmbedder] 获取书本失败: ${bookId}`, error)
        setBookData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookData()
  }, [bookId])

  if (isLoading) {
    return (
      <Card className="max-w-sm mx-auto w-full overflow-hidden border border-gray-100 bg-white shadow-sm animate-pulse">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="h-[120px] w-20 flex-shrink-0 rounded-lg bg-gray-200" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 py-1">
              <div className="h-5 rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="mt-auto h-4 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!bookData) return null

  const bookTitle = bookData.title || title
  const bookAuthor = bookData.authors || author
  const bookRating = bookData.rating || rating || 0
  const bookCover = getCoverUrl(bookData.cover_image || cover)
  const bookLink = `/dashboard/book/${bookData.slug || bookId}`

  if (layout === 'focus' || layout === 'grid') {
    return (
      <Link href={bookLink} className="block w-full h-full group">
        <Card className="h-full border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-0">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={bookCover}
                alt={bookTitle}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
              />
            </div>
            <div className="space-y-2 px-1 py-3">
              <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-slate-900 group-hover:text-blue-600">
                {bookTitle}
              </h3>
              <p className="line-clamp-1 text-[13px] font-medium text-slate-600">{bookAuthor}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Link href={bookLink} className="group mx-auto block w-full max-w-sm">
      <Card className="overflow-hidden border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative h-[120px] w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={bookCover}
                alt={bookTitle}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="mb-1 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                {bookTitle}
              </h3>
              <p className="mb-2 line-clamp-1 text-sm text-gray-600">{bookAuthor}</p>
              {bookData.one_liner && (
                <p className="mb-2 line-clamp-2 text-sm text-gray-500">
                  {bookData.one_liner}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(bookData.audio_duration)}
                </span>
                {bookRating > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current text-yellow-400" />
                    {bookRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}