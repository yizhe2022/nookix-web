"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, Layers, Headphones } from "lucide-react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
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
}

interface Collection {
  id: string
  title: string
  subtitle: string
  curatorNote: string
  totalBooks: number
  totalDuration: string
  coverUrl: string
  books: CollectionBook[]
}

interface DashboardCollectionDetailClientProps {
  collection: Collection
}

function parseDurationSeconds(duration: string): number | undefined {
  const parts = duration.split(':').map(part => Number(part.trim()))

  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1]
  }

  const minuteMatch = duration.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minute)/i)
  if (minuteMatch) return Math.round(Number(minuteMatch[1]) * 60)

  return undefined
}

export default function DashboardCollectionDetailClient({ collection }: DashboardCollectionDetailClientProps) {
  const { playBook, isUserPremium } = useAudioPlayer()

  const handlePlayAudio = (book: CollectionBook, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!book.audioFile) return

    const audioBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.coverUrl,
      audioDurationSeconds: parseDurationSeconds(book.audioDuration),
      chapters: [
        {
          id: book.id,
          title: book.title,
          duration: book.audioDuration,
          is_free: !book.isPremium,
        }
      ],
      isPremium: book.isPremium || false,
    }

    const shouldUsePreviewAudio = Boolean(audioBook.isPremium && !isUserPremium)

    playBook(audioBook, book.id, undefined, {
      playbackLimit: null,
      audioSource: shouldUsePreviewAudio ? 'preview' : 'full'
    })
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
      
      {/* 面包屑导航 */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-12">
        <Link href="/dashboard/for-you" className="hover:text-blue-600">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/dashboard/collections" className="hover:text-blue-600">
          Collections
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{collection.title}</span>
      </nav>

      {/* Hero 区域 */}
      <header className="mb-20">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-center md:items-start">
          
          {/* 左侧：文字内容 */}
          <div className="flex-1 order-2 md:order-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-5 leading-[1.1] text-balance">
              {collection.title}
            </h1>
            <p className="text-xl text-slate-600 font-semibold mb-8 leading-snug">
              {collection.subtitle}
            </p>
            
            {/* Meta 数据标签 */}
            <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold text-slate-500 mb-10">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/[0.04] shadow-sm">
                <Layers size={14} className="text-blue-500" />
                {collection.totalBooks} Books Included
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/[0.04] shadow-sm">
                <Clock size={14} className="text-emerald-500" />
                {collection.totalDuration} Total Duration
              </div>
            </div>

            {/* 策展人寄语 */}
            <div className="bg-white rounded-2xl p-6 md:p-8 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] relative">
              <div className="absolute top-0 left-8 -translate-y-1/2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ring-1 ring-blue-100/50">
                Curator's Note
              </div>
              <p className="text-slate-600 leading-relaxed font-medium text-[15px]">
                {collection.curatorNote}
              </p>
            </div>
          </div>

          {/* 右侧：1:1 比例的封面 */}
          <div className="w-full shrink-0 order-1 md:order-2 md:max-w-[280px] lg:max-w-[340px]">
             <div className="relative w-full aspect-square">
                <Image 
                  src={collection.coverUrl || '/placeholder.svg'} 
                  alt="Collection Cover" 
                  fill 
                  className="object-cover rounded-2xl ring-1 ring-black/[0.04] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]" 
                  priority 
                />
             </div>
          </div>

        </div>
      </header>

      {/* 书籍列表区 */}
      <section>
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Collection Books
          </h2>
        </div>

        <div className="space-y-6">
          {collection.books.map((book, index) => {
            const bookDetailUrl = `/dashboard/book/${book.slug}`
            
            return (
              <div
                key={book.id}
                className="group relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-6 bg-white rounded-[2rem] ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:ring-black/[0.08] transition-all duration-300 overflow-hidden"
              >
                
                {/* 高级水印数字设计 */}
                <div className="absolute -right-4 -top-10 text-[140px] font-black text-slate-50 group-hover:text-blue-50/60 transition-colors pointer-events-none select-none z-0 tracking-tighter">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* 左侧：书籍封面 */}
                <div className="relative w-24 sm:w-32 aspect-[2/3] shrink-0 self-start rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] z-10 transition-transform duration-500 group/cover mx-auto sm:mx-0">
                  <Image 
                    src={book.coverUrl} 
                    alt={book.title} 
                    fill 
                    className="object-cover" 
                    style={{ objectFit: "cover" }}
                  />
                  
                  {/* 始终显示耳机按钮，但只有有音频时才可点击 */}
                  <button
                    onClick={(e) => book.audioFile ? handlePlayAudio(book, e) : e.preventDefault()}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/cover:opacity-100"
                    aria-label="Play audio"
                    disabled={!book.audioFile}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl ring-1 ring-black/5 scale-90 transition-transform duration-300 group-hover/cover:scale-100">
                      <Headphones size={20} strokeWidth={2.2} />
                    </div>
                  </button>
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
                  
                  <Link href={bookDetailUrl}>
                    <h3 className="text-[18px] sm:text-xl font-bold text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors leading-snug text-balance cursor-pointer">
                      {book.title}
                    </h3>
                  </Link>
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
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
