"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Clock, Star } from "lucide-react"

interface BookCardWebProps {
  book: {
    id: string
    title: string
    authors: string
    cover_image: string
    rating: number
    audio_duration?: number
    slug?: string
  }
  priority?: boolean
}

const BookCardWeb = memo(({ book, priority = false }: BookCardWebProps) => {
  const bookUrl = `/dashboard/book/${book.slug}`
  
  const getCoverUrl = (coverImage: string) => {
    if (!coverImage) return "/placeholder.svg"
    if (coverImage.startsWith("http")) return coverImage
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${coverImage}`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "30min"
    return `${Math.ceil(seconds / 60)}min`
  }

  return (
    <Link href={bookUrl} className="block group">
      <div className="flex flex-col">
        {/* 书本封面 */}
        <div className="relative mb-3">
          <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:ring-black/[0.08]">
            <Image
              src={getCoverUrl(book.cover_image)}
              alt={book.title || "Book cover"}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 200px"
              className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
              priority={priority}
            />
          </div>
        </div>

        {/* 书本信息 */}
        <div className="px-1 space-y-2">
          <h3 className="line-clamp-2 text-balance text-[14px] font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[15px]">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-[13px] font-medium text-slate-600">
            {book.authors}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatDuration(book.audio_duration)}</span>
            </div>
            {book.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">{book.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
})

BookCardWeb.displayName = "BookCardWeb"

export default BookCardWeb
