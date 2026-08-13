"use client"

import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import { formatRatingsCount } from "@/lib/format-utils"

interface CollectionBook {
  id: string
  title: string
  author: string
  coverUrl: string
  audioDuration: string
  ratingsCount: number
  oneLiner: string
  audioFile: string | null
  isPremium?: boolean
  slug?: string
  chapters?: any[]
}

interface CollectionBookListProps {
  books: CollectionBook[]
}

export default function CollectionBookList({ books }: CollectionBookListProps) {
  return (
    <div className="space-y-6">
      {books.map((book, index) => {
        // 生成书本详情页 URL（纯 slug）
        const bookDetailUrl = `/book/${book.slug}`
        
        return (
          <Link
            key={book.id}
            href={bookDetailUrl}
            className="group relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-6 bg-white rounded-[2rem] ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:ring-black/[0.08] transition-all duration-300 overflow-hidden block"
          >
            
            {/* 高级水印数字设计 */}
            <div className="absolute -right-4 -top-10 text-[140px] font-black text-slate-50 group-hover:text-blue-50/60 transition-colors pointer-events-none select-none z-0 tracking-tighter">
              {String(index + 1).padStart(2, '0')}
            </div>

            {/* 左侧：书籍封面 */}
            <div className="relative w-24 sm:w-32 aspect-[2/3] shrink-0 self-start rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] z-10 transition-transform duration-500 mx-auto sm:mx-0">
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" style={{ objectFit: "cover" }} />
            </div>

            {/* 右侧：书籍内容与核心启发 */}
            <div className="flex-1 relative z-10 flex flex-col justify-center py-1 text-center sm:text-left">
              
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                {/* 时长胶囊（蓝色） */}
                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 ring-1 ring-blue-100/50 flex items-center gap-1">
                  <Clock size={11}/> {book.audioDuration}
                </span>
                {/* ratings_count（普通文本） */}
                {book.ratingsCount > 0 && (
                  <span className="text-slate-400 text-xs font-bold">
                    {formatRatingsCount(book.ratingsCount)} ratings
                  </span>
                )}
              </div>
              
              <h3 className="text-[18px] sm:text-xl font-bold text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors leading-snug text-balance cursor-pointer">
                {book.title}
              </h3>
              <p className="text-[13px] font-medium text-slate-500 mb-5">
                by {book.author}
              </p>

              {/* One-liner 文本框 - 移动端限制2行，桌面端不限制 */}
              <div className="bg-slate-50/80 rounded-xl p-4 ring-1 ring-black/[0.03]">
                <p className="text-[13px] sm:text-[14px] text-slate-600 leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
                  {book.oneLiner}
                </p>
              </div>

            </div>
          </Link>
        );
      })}
    </div>
  )
}
