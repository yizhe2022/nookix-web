"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import { formatRatingsCount } from "@/lib/format-utils"

interface GenreBook {
  id: string
  title: string
  authors: string
  cover_image: string
  audio_duration?: number
  ratings_count?: number
  one_liner?: string
  summary?: string
  audio_file?: string | null
  is_premium?: boolean
  slug?: string
}

interface GenreBookListEnhancedProps {
  books: GenreBook[]
}

export default function GenreBookListEnhanced({ books }: GenreBookListEnhancedProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {books.map((book, index) => {
        // 计算音频时长（分钟，四舍五入）
        let audioDurationMinutes = 30
        if (book.audio_duration) {
          audioDurationMinutes = Math.round(book.audio_duration / 60)
        }
        
        // 生成书本详情页 URL（纯 slug）
        const bookDetailUrl = `/book/${book.slug}`
        
        // 使用 Supabase 的 cover_image 直接路径（不需要拼接 PocketBase URL）
        const coverUrl = book.cover_image || ''
        
        return (
          <Link
            key={book.id}
            href={bookDetailUrl}
            className="group relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-6 bg-white rounded-[2rem] ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:ring-black/[0.08] transition-all duration-300 overflow-hidden"
          >

            {/* 左侧：书籍封面 */}
            <div className="relative w-24 sm:w-28 aspect-[2/3] shrink-0 self-start rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] z-10 transition-transform duration-500 mx-auto sm:mx-0">
              {coverUrl ? (
                <Image src={coverUrl} alt={book.title} fill className="object-cover" style={{ objectFit: "cover" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                  <span className="text-slate-400 text-xs">No Cover</span>
                </div>
              )}
            </div>

            {/* 右侧：书籍内容 */}
            <div className="flex-1 relative z-10 flex flex-col pt-2 text-center sm:text-left">
              
              {/* 时长和评分 */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                {/* 时长胶囊（蓝色） */}
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 ring-1 ring-blue-100/50 flex items-center gap-1">
                  <Clock size={11}/> {audioDurationMinutes}min
                </span>
                {/* ratings_count（普通文本） */}
                {book.ratings_count && book.ratings_count > 0 && (
                  <span className="text-slate-400 text-xs font-bold">
                    {formatRatingsCount(book.ratings_count)} ratings
                  </span>
                )}
              </div>

              <h3 className="text-[16px] sm:text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors leading-snug text-balance cursor-pointer line-clamp-3">
                {book.title}
              </h3>
              <p className="text-[13px] font-medium text-slate-500 line-clamp-2">
                by {book.authors || "Unknown Author"}
              </p>

            </div>
          </Link>
        );
      })}
    </div>
  )
}
