"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import DashboardBookHeader from "@/components/dashboard/dashboard-book-header"
import BookDetailContent from "@/components/book/book-detail-content"
import BookReader from "@/components/dashboard/book-reader"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useReader } from "@/contexts/reader-context"
import { getFileUrl } from "@/lib/pocketbase-service"
import { getAuthorName } from "@/lib/author-utils"

/**
 * 从 book_transcript 提取第一个 section 的结束时间（即第二个 section 的 startTime）。
 * 用于 dashboard 对免费用户限制付费书的播放范围。
 * 回退值 300 秒（5 分钟），与 context 内部逻辑保持一致。
 */
function resolveFirstSectionLimit(transcript: any): number {
  const FALLBACK = 300
  if (!transcript) return FALLBACK
  try {
    const parsed = typeof transcript === 'string' ? JSON.parse(transcript) : transcript
    const sections = parsed?.sections
    if (Array.isArray(sections) && sections.length > 1) {
      const t = sections[1]?.paragraphs?.[0]?.sentences?.[0]?.startTime
      if (typeof t === 'number' && t > 0) return t
    }
  } catch {
    // 解析失败使用回退值
  }
  return FALLBACK
}

interface DashboardBookDetailWrapperProps {
  bookId: string
  initialBook?: any
  initialChapters?: any[]
  initialRelatedBooks?: any[]
  popularBooks?: any[]
  genres?: { title: string, slug: string }[]
}

export default function DashboardBookDetailWrapper({
  bookId,
  initialBook,
  initialChapters,
  initialRelatedBooks,
  popularBooks = [],
  genres = []
}: DashboardBookDetailWrapperProps) {
  const { playBook, isUserPremium } = useAudioPlayer()
  const { isReaderOpen, setIsReaderOpen } = useReader()
  
  // 方案 A：跟踪是否已经播放过一次（用于首次播放自动打开阅读器）
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)

  // 处理立即播放
  const handlePlayNow = useCallback(() => {
    if (!initialBook) return
    
    // 解析 summary_audio
    let summaryAudioList: string[] = []
    if (initialBook.summary_audio) {
      if (Array.isArray(initialBook.summary_audio)) {
        summaryAudioList = initialBook.summary_audio
      } else if (typeof initialBook.summary_audio === 'string') {
        const cleaned = initialBook.summary_audio.trim()
        if (cleaned) {
          summaryAudioList = cleaned.includes(',')
            ? cleaned.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : [cleaned]
        }
      }
    }

    const chapters = summaryAudioList.map((audioFile, index) => ({
      id: `summary_${index + 1}`,
      title: summaryAudioList.length > 1 ? `Section ${index + 1}` : 'Full Summary',
      audio_file: audioFile,
      is_free: false,
      duration: '--:--'
    }))

    const audioBook = {
      id: initialBook.id,
      title: initialBook.title,
      author: getAuthorName(initialBook),
      cover: initialBook.cover_image 
        ? getFileUrl({ ...initialBook, collectionName: 'books', collectionId: initialBook.collectionId || '' }, initialBook.cover_image) 
        : '/placeholder.svg',
      summary_audio: initialBook.summary_audio,
      audioDurationSeconds: typeof initialBook.audio_duration === 'number' ? initialBook.audio_duration : undefined,
      chapters,
      isPremium: initialBook.is_premium || false,
      book_transcript: initialBook.book_transcript,
    }
    
    // 方案 A：如果是首次播放，自动打开阅读器
    if (!hasPlayedOnce) {
      setIsReaderOpen(true)
      setHasPlayedOnce(true)
    }
    
    // Dashboard 播放规则：
    //   免费用户 + 免费书 → full，无限制
    //   免费用户 + 付费书 → full，限制到第一个 section 结束（book_transcript 时间戳）
    //   Premium 用户    → full，无限制
    const isPremiumBook = audioBook.isPremium
    const playbackLimit = (!isUserPremium && isPremiumBook)
      ? resolveFirstSectionLimit(initialBook.book_transcript)
      : null

    playBook(audioBook, undefined, undefined, {
      playbackLimit,
      audioSource: 'full',
    })
  }, [initialBook, playBook, hasPlayedOnce, setIsReaderOpen, isUserPremium])

  // 处理打开阅读器
  const handleOpenReader = useCallback(() => {
    setIsReaderOpen(true)
    // 打开阅读器时自动播放
    handlePlayNow()
  }, [handlePlayNow, setIsReaderOpen])

  // 处理关闭阅读器
  const handleCloseReader = useCallback(() => {
    setIsReaderOpen(false)
    // 音频继续播放，用户可以在详情页控制
  }, [setIsReaderOpen])

  // 页面切换只关闭沉浸式阅读器；全局播放会话和播放条必须跨路由保留。
  useEffect(() => {
    return () => {
      setIsReaderOpen(false)
    }
  }, [setIsReaderOpen])

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* 面包屑导航和书本头部 */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
          <Link href="/dashboard/for-you" className="hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/explore" className="hover:text-gray-900 transition-colors">
            Explore
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium line-clamp-1">{initialBook?.title || 'Book'}</span>
        </nav>

        {/* 书本头部信息（封面、标题、作者、评分等） - 使用专门的用户后台组件 */}
        <DashboardBookHeader book={initialBook} onPlayNow={handlePlayNow} onOpenReader={handleOpenReader} />
      </div>

      {/* 主内容区域 - 白色背景 */}
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-10 md:pb-12">
        <div className="px-0 md:px-6 lg:px-8 pt-0 md:pt-6 lg:pt-8 pb-0 md:pb-6 lg:pb-8 md:bg-white md:rounded-2xl md:shadow-sm -mt-2">
          {/* 书本详情内容（所有模块） */}
          <BookDetailContent
            bookId={bookId}
            initialBook={initialBook}
            initialChapters={initialChapters}
            initialRelatedBooks={initialRelatedBooks}
            popularBooks={popularBooks}
            genres={genres}
            onPlayFromDashboard={handlePlayNow}
            isDashboard={true}
          />
        </div>
      </div>

      {/* 沉浸式阅读器 */}
      <BookReader
        bookId={bookId}
        bookTitle={initialBook?.title || 'Book'}
        bookAuthor={getAuthorName(initialBook)}
        book={initialBook}
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
      />

      {/* 注意：不包含 BookFooterSections（统计模块及以下的营销内容） */}
    </div>
  )
}
