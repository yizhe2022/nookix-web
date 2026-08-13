"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, Headphones } from "lucide-react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { formatDurationMinutes, formatRatingsCount } from "@/lib/format-utils"

interface Genre {
  id: string
  name: string
  slug?: string
  description?: string
  icon_emoji?: string
}

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

interface DashboardGenreClientProps {
  genre: Genre
  books: GenreBook[]
}

export default function DashboardGenreClient({ genre, books }: DashboardGenreClientProps) {
  const { playBook, isUserPremium } = useAudioPlayer()

  const handlePlayAudio = (book: GenreBook, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!book.audio_file) return

    const coverUrl = book.cover_image || ''
    const audioDuration = formatDurationMinutes(book.audio_duration)

    const audioBook = {
      id: book.id,
      title: book.title,
      author: book.authors || "Unknown Author",
      cover: coverUrl,
      audioDurationSeconds: typeof book.audio_duration === 'number' ? book.audio_duration : undefined,
      chapters: [
        {
          id: book.id,
          title: book.title,
          duration: audioDuration,
          is_free: !book.is_premium,
        }
      ],
      isPremium: book.is_premium || false,
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
        <Link href="/dashboard/explore" className="hover:text-blue-600">
          Explore
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{genre.name}</span>
      </nav>

      {/* 标题区域 */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-4">
          {genre.icon_emoji && (
            <span className="text-4xl">{genre.icon_emoji}</span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {genre.name}
          </h1>
        </div>
        {genre.description && (
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
            {genre.description}
          </p>
        )}
      </div>

      {/* 书籍列表 */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books.map((book) => {
            const audioDuration = formatDurationMinutes(book.audio_duration)
            
            const bookDetailUrl = `/dashboard/book/${book.slug}`
            const coverUrl = book.cover_image || ''
            
            return (
              <div
                key={book.id}
                className="group relative flex flex-col sm:flex-row gap-5 sm:gap-8 p-5 sm:p-6 bg-white rounded-[2rem] ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:ring-black/[0.08] transition-all duration-300 overflow-hidden"
              >
                {/* 左侧：书籍封面 */}
                <div className="relative w-24 sm:w-28 aspect-[2/3] shrink-0 self-start rounded-xl overflow-hidden bg-slate-100 ring-1 ring-black/[0.04] z-10 transition-transform duration-500 group/cover mx-auto sm:mx-0">
                  {coverUrl ? (
                    <Image 
                      src={coverUrl} 
                      alt={book.title} 
                      fill 
                      className="object-cover" 
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <span className="text-slate-400 text-xs">No Cover</span>
                    </div>
                  )}
                  
                  {/* 始终显示耳机按钮，但只有有音频时才可点击 */}
                  <button
                    onClick={(e) => book.audio_file ? handlePlayAudio(book, e) : e.preventDefault()}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/5 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover/cover:opacity-100"
                    aria-label="Play audio"
                    disabled={!book.audio_file}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl ring-1 ring-black/5 scale-90 transition-transform duration-300 group-hover/cover:scale-100">
                      <Headphones size={18} strokeWidth={2.2} />
                    </div>
                  </button>
                </div>

                {/* 右侧：书籍内容 */}
                <div className="flex-1 relative z-10 flex flex-col pt-2 text-center sm:text-left">
                  
                  {/* 时长和评分 */}
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    {/* 时长胶囊（蓝色） */}
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-600 ring-1 ring-blue-100/50 flex items-center gap-1">
                      <Clock size={11}/> {audioDuration}
                    </span>
                    {/* ratings_count（普通文本） */}
                    {book.ratings_count && book.ratings_count > 0 && (
                      <span className="text-slate-400 text-xs font-bold">
                        {formatRatingsCount(book.ratings_count)} ratings
                      </span>
                    )}
                  </div>

                  <Link href={bookDetailUrl}>
                    <h3 className="text-[16px] sm:text-lg font-bold text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors leading-snug text-balance cursor-pointer line-clamp-3">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-[13px] font-medium text-slate-500 line-clamp-2">
                    by {book.authors || "Unknown Author"}
                  </p>

                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No books found in this genre.</p>
        </div>
      )}
    </div>
  )
}
