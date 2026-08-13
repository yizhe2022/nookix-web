'use client'

import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Play, Pause, Crown, Headphones, Loader2, CheckCircle2, ArrowRight, Quote, Calendar, Download } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getBookById, getBookTranscriptById, getRelatedBooksByPrimaryGenre } from '@/lib/supabase-service'
import LoginDialog from '@/components/auth/login-dialog'
import PremiumConfirmationDialog from '@/components/ui/premium-confirmation-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DeepSummaryViewer } from '@/components/book/deep-summary-viewer'
import { getAuthorName } from '@/lib/author-utils'
import { getSlugForGenre } from "@/lib/genre-slugs"
import AudioTimeline from './modules/audio-timeline'
import SummaryPreviewSection from './modules/summary-preview-section'
import WhatYouGetSection from './modules/what-you-get-section'
import KeyTakeawaysSection from './modules/key-takeaways-section'
import CommunityReviewsSection from './modules/community-reviews-section'
import TargetAudienceSection from './modules/target-audience-section'
import AuthorBioSection from './modules/author-bio-section'
import BookTocPortal from './book-toc-portal'
import TableOfContentsMobile from './modules/table-of-contents-mobile'
import BookCarouselWithHeader from './book-carousel-with-header'
import { getPlayButtonText } from '@/lib/audio-playback-utils'
import { formatDurationClock } from '@/lib/format-utils'
import RichText from '@/components/ui/rich-text'
import { useSubscription } from '@/hooks/use-subscription'
import { useAudioPlayer } from '@/contexts/audio-player-context'

interface BookDetailContentProps {
  bookId: string
  initialBook?: any
  initialChapters?: any[]
  initialRelatedBooks?: any[]
  popularBooks?: any[]
  genres?: { title: string, slug: string }[]
  onPlayFromDashboard?: () => void
  isDashboard?: boolean
}

export default function BookDetailContent({
  bookId,
  initialBook,
  initialChapters,
  initialRelatedBooks,
  popularBooks = [],
  genres = [],
  onPlayFromDashboard,
  isDashboard = false
}: BookDetailContentProps) {
  const [book, setBook] = useState<any>(initialBook || null)
  const [chapters, setChapters] = useState<any[]>(initialChapters || [])
  const [loading, setLoading] = useState(!initialBook)
  const [relatedBooks, setRelatedBooks] = useState<any[]>(initialRelatedBooks || [])
  const [refreshingRelated, setRefreshingRelated] = useState(false)
  const [showMembershipDialog, setShowMembershipDialog] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const { 
    playBook: playBookFromContext,
    currentBook,
    currentTrack,
    isPlaying,
    currentTime,
    togglePlay,
    seekTo
  } = useAudioPlayer()
  const isUserLoggedIn = !!user
  const isPremium = subscription.isActive
  const [audioDurations, setAudioDurations] = useState<{ [chapterId: string]: number }>({})
  const [mounted, setMounted] = useState(false)
  
  // 官网预览音频播放器（简单独立实现）
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // 清理函数：组件卸载时停止预览音频
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  // 初始化章节数据（仅用于 Dashboard）
  useEffect(() => {
    if (!initialBook) return

    if (!isDashboard) {
      // ========== 官网页面：不需要处理 chapters ==========
      console.log('📖 [Initial] 官网页面，不处理 chapters')
      setChapters([])
    } else {
      // ========== Dashboard 页面：处理完整音频 ==========
      if (initialBook.summary_audio) {
        const chaptersList = parseSummaryAudioTracks(initialBook.summary_audio)
        if (chaptersList.length > 0) {
          console.log('📖 [Initial] Dashboard 页面，生成章节:', chaptersList.length, '个')
          setChapters(chaptersList)
        }
      }
    }
  }, [initialBook, isDashboard])

  // Helper: 解析 summary_audio 为章节列表（仅用于 Dashboard）
  const parseSummaryAudioTracks = (summaryAudio: any): any[] => {
    let audioFiles: string[] = []

    if (Array.isArray(summaryAudio)) {
      audioFiles = summaryAudio
    } else if (typeof summaryAudio === 'string') {
      const cleaned = summaryAudio.trim()
      if (cleaned) {
        audioFiles = cleaned.includes(',')
          ? cleaned.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : [cleaned]
      }
    }

    if (audioFiles.length === 0) {
      return initialChapters && initialChapters.length > 0
        ? initialChapters.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        : []
    }

    const formatTitle = (filename: string) => {
      if (!filename) return ''
      const lastDotIndex = filename.lastIndexOf('.')
      const nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename
      return nameWithoutExt.split(/[_\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }

    return audioFiles.map((audioFile, index) => ({
      id: `summary_${index + 1}`,
      title: audioFiles.length > 1 ? `Section ${index + 1}` : 'Full Summary',
      audio_file: audioFile,
      is_free: false,
      chapter_duration_seconds: 0,
      order: index + 1,
      is_from_book: true
    }))
  }

  const handlePremiumChapterClick = () => {
    // Redirect to dashboard book page
    if (!isUserLoggedIn) {
      const bookSlug = book?.slug
      localStorage.setItem('redirectAfterLogin', `/dashboard/book/${bookSlug}`)
      router.push('/auth/signin?redirect=book')
    } else {
      const bookSlug = book?.slug
      router.push(`/dashboard/book/${bookSlug}`)
    }
  }

  const handleLoginSuccess = async () => {
    // Check if there's a redirect URL saved
    const redirectUrl = localStorage.getItem('redirectAfterLogin')
    
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin')
      router.push(redirectUrl)
    } else {
      // Default: redirect to dashboard for-you page
      router.push(`/dashboard/for-you`)
    }
  }

  useEffect(() => {
    const fetchBookData = async () => {
      // 如果有初始数据且ID匹配，直接使用初始数据，但仍需获取相关书籍
      if (initialBook && initialBook.id === bookId && !loading) {
        // 如果有初始相关书籍，就不再重复获取
        if (!initialRelatedBooks || initialRelatedBooks.length === 0) {
          await fetchRelatedBooks(initialBook)
        }
        return
      }

      try {
        setLoading(true)

        // 添加时间戳参数确保获取最新数据
        const timestamp = Date.now()

        // 获取书本信息，展开genres和author关联
        const bookData = await getBookById(bookId)
        
        if (!bookData) {
          console.error('❌ 未找到书本数据')
          setLoading(false)
          return
        }

        console.log('📚 获取到的书本数据:', bookData)
        console.log('📊 genres字段原始数据:', bookData.genres)

        // Supabase 版本已经处理好了 genres 数据，直接使用即可

        setBook(bookData)

        // 获取章节信息（仅用于 Dashboard）
        let chaptersList: any[] = []

        if (!isDashboard) {
          // ========== 官网页面：不处理 chapters ==========
          console.log('📖 [fetchBookData] 官网页面，不处理 chapters')
          chaptersList = []
        } else {
          // ========== Dashboard 页面：处理完整音频 ==========
          chaptersList = parseSummaryAudioTracks(bookData.summary_audio)
          if (chaptersList.length > 0) {
            console.log('📖 [fetchBookData] Dashboard 页面，生成章节:', chaptersList.length, '个')
          } else {
            console.log('⚠️ [fetchBookData] Dashboard 页面，无 summary_audio 数据')
          }
        }

        setChapters(chaptersList)

        // 获取相关书籍 - 仅当没有初始数据时才自动获取
        if (!initialRelatedBooks || initialRelatedBooks.length === 0) {
          await fetchRelatedBooks(bookData)
        }
      } catch (error) {
        console.error('获取书本数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookData()
  }, [bookId])

  const fetchRelatedBooks = async (currentBook?: any, refresh = false) => {
    if (refresh) setRefreshingRelated(true)
    try {
      const bookToUse = currentBook || book
      if (!bookToUse) return

      // 使用 Supabase 服务获取相关书籍
      // 获取主 genre（sort_order = 0 或第一个 genre）
      const primaryGenre = bookToUse.genres?.find((g: any) => g.sort_order === 0) || bookToUse.genres?.[0]
      
      if (!primaryGenre || !primaryGenre.id) {
        console.warn('⚠️ 没有找到主 genre，无法获取相关书籍')
        setRelatedBooks([])
        return
      }

      console.log('🔍 获取相关书籍，主 genre:', primaryGenre.name)
      
      const relatedBooksData = await getRelatedBooksByPrimaryGenre(bookId, primaryGenre.id, 10)
      setRelatedBooks(relatedBooksData || [])
      
      console.log(`✅ 获取到 ${relatedBooksData?.length || 0} 本相关书籍`)
    } catch (error) {
      console.error('获取相关书籍失败:', error)
      setRelatedBooks([])
    } finally {
      if (refresh) setRefreshingRelated(false)
    }
  }

  const handleGenreClick = (genre: string | any) => {
    let genreName = typeof genre === 'string' ? (genre.length > 15 ? book?.expand?.genres?.find((g: any) => g.id === genre)?.name || 'Unknown' : genre) : (genre?.name || 'Unknown')
    router.push(`/genres/${getSlugForGenre(genreName)}`)
  }

  const formatDuration = formatDurationClock

  useEffect(() => {
    if (!chapters || chapters.length === 0) return

    setAudioDurations((prev) => {
      const next = { ...prev }
      let changed = false

      chapters.forEach((chapter) => {
        if (next[chapter.id] !== undefined) return

        const duration = chapter.chapter_duration_seconds || book?.audio_duration || initialBook?.audio_duration || 3600
        next[chapter.id] = duration
        changed = true
      })

      return changed ? next : prev
    })
  }, [chapters, book?.audio_duration, initialBook?.audio_duration])

  // 处理立即播放
  const handlePlayNow = useCallback(async (startTime: number = 0) => {
    if (!book) return
    
    // ========== 官网页面：通过 Worker 签名播放预览音频 ==========
    if (!isDashboard) {
      try {
        setIsLoadingPreview(true)
        
        const websiteAudioType = (book.is_premium || book.isPremium) ? 'preview' : 'full'

        // 从 Worker 签名 API 获取预签名 URL
        console.log('[官网] 请求 Worker 签名 URL for book:', book.id)
        const response = await fetch('/api/audio-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, audioType: websiteAudioType })
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('[官网] 获取签名 URL 失败:', error)
          throw new Error(error.error || 'Failed to load audio')
        }

        const data = await response.json()
        console.log('[官网] 收到签名 URL')
        
        // 初始化音频对象
        if (!previewAudioRef.current) {
          previewAudioRef.current = new Audio()
          previewAudioRef.current.preload = 'metadata'
          previewAudioRef.current.crossOrigin = 'anonymous'
          
          // 播放进度同步
          previewAudioRef.current.ontimeupdate = () => {
            setPreviewCurrentTime(previewAudioRef.current?.currentTime || 0)
          }

          // 播放结束时的处理
          previewAudioRef.current.onended = () => {
            console.log('[官网] 预览音频播放完毕')
            setIsPreviewPlaying(false)
            setPreviewCurrentTime(0)
            
            const bookSlug = book.slug
            if (!isUserLoggedIn) {
              // 未登录：引导登录
              localStorage.setItem('redirectAfterLogin', `/dashboard/book/${bookSlug}`)
              setTimeout(() => setShowLoginDialog(true), 500)
            } else {
              // 已登录：提示跳转到用户后台
              if (confirm('Preview ended. Go to dashboard to listen to the full audiobook?')) {
                window.location.href = `/dashboard/book/${bookSlug}`
              }
            }
          }
          
          // 错误处理
          previewAudioRef.current.onerror = (e) => {
            console.error('[官网] 预览音频加载失败:', e)
            setIsPreviewPlaying(false)
            setIsLoadingPreview(false)
            alert('Failed to load audio preview. Please try again.')
          }
          
          // 加载完成
          previewAudioRef.current.onloadedmetadata = () => {
            console.log('[官网] 音频元数据加载完成')
            setIsLoadingPreview(false)
          }
        }
        
        // 设置音频源并播放
        previewAudioRef.current.src = data.url
        if (startTime > 0) {
          previewAudioRef.current.addEventListener('loadedmetadata', () => {
            if (!previewAudioRef.current) return
            const safeStartTime = previewAudioRef.current.duration > 0
              ? Math.min(startTime, Math.max(0, previewAudioRef.current.duration - 0.1))
              : startTime
            previewAudioRef.current.currentTime = Math.max(0, safeStartTime)
          }, { once: true })
        }
        await previewAudioRef.current.play()
        setIsPreviewPlaying(true)
        console.log('[官网] 通过 Worker 播放预览音频')
        return
      } catch (error) {
        console.error('[官网] 播放失败:', error)
        setIsPreviewPlaying(false)
        setIsLoadingPreview(false)
        return
      }
      
      // 没有预览音频：引导用户去用户后台
      const bookSlug = book.slug
      if (!isUserLoggedIn) {
        localStorage.setItem('redirectAfterLogin', `/dashboard/book/${bookSlug}`)
        setShowLoginDialog(true)
      } else {
        window.location.href = `/dashboard/book/${bookSlug}`
      }
      return
    }
    
    // 付费书的 transcript 仅在免费试听边界计算时按需读取。
    const requiresPlaybackLimit = !isPremium && (book.is_premium || book.isPremium)
    let bookTranscript = book.book_transcript

    if (requiresPlaybackLimit && !bookTranscript) {
      bookTranscript = await getBookTranscriptById(book.id)
    }

    const audioBook = {
      id: book.id,
      title: book.title,
      author: book.authors || book.author || 'Unknown Author',
      cover: book.cover_image || '/placeholder.svg',
      slug: book.slug,
      summary_audio: book.summary_audio,
      audioDurationSeconds: typeof book.audio_duration === 'number' ? book.audio_duration : undefined,
      chapters: chapters,
      isPremium: book.is_premium || book.isPremium,
      book_transcript: bookTranscript
    }
    
    // 已登录非会员用户 + Premium 书本：播放限制的音频
    if (requiresPlaybackLimit) {
      console.log('[用户后台] 非会员播放 Premium 书本，应用播放限制')
      
      let playbackLimit = 300 // 默认 5 分钟
      
      if (bookTranscript) {
        try {
          const transcript = typeof bookTranscript === 'string'
            ? JSON.parse(bookTranscript)
            : bookTranscript
          
          if (transcript?.sections && Array.isArray(transcript.sections) && transcript.sections.length > 1) {
            const secondSection = transcript.sections[1]
            if (secondSection?.paragraphs?.[0]?.sentences?.[0]?.startTime) {
              playbackLimit = secondSection.paragraphs[0].sentences[0].startTime
              console.log('[用户后台] ✅ 从 book_transcript 读取播放限制:', playbackLimit, '秒')
            }
          }
        } catch (e) {
          console.warn('[用户后台] ❌ 解析 book_transcript 失败，使用默认限制', e)
        }
      }
      
      playBookFromContext(audioBook, undefined, true, {
        playbackLimit: playbackLimit,
        audioSource: 'full',
        startTime,
        onLimitReached: () => {
          console.log('[用户后台] 达到播放限制，显示会员升级对话框')
          setTimeout(() => setShowMembershipDialog(true), 0)
        }
      })
      return
    }
    
    // 会员用户或免费书本：播放完整音频
    console.log('[用户后台] 会员或免费书本，播放完整音频')
    playBookFromContext(audioBook, undefined, true, {
      playbackLimit: null,
      audioSource: 'full',
      startTime
    })
  }, [book, chapters, isUserLoggedIn, isPremium, isDashboard, playBookFromContext, getBookTranscriptById])

  // 处理头部按钮点击
  const handleHeaderButtonClick = useCallback(() => {
    if (!book) return
    
    // ========== 官网页面：直接播放 preview 音频 ==========
    if (!isDashboard) {
      // 直接调用播放逻辑，不再检查登录状态
      handlePlayNow()
      return
    }
    
    // ========== 用户后台：调用播放逻辑 ==========
    handlePlayNow()
  }, [book, isDashboard, handlePlayNow])

  const handleAmazonPurchase = () => {
    if (book.amazon_url) window.open(book.amazon_url, '_blank', 'noopener,noreferrer')
  }

  const Portal = ({ children, selector }: { children: React.ReactNode, selector: string }) => {
    if (!mounted) return null
    const element = document.querySelector(selector)
    if (!element) return null
    return createPortal(children, element)
  }

  const headerActionsPortal = (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
      <Button
        className="w-full bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
        onClick={handleHeaderButtonClick}
        disabled={isLoadingPreview}
      >
        {isLoadingPreview
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          : <Headphones className="mr-2 h-4 w-4" />}
        {getPlayButtonText(book, isUserLoggedIn, isPremium)}
      </Button>
      {!isDashboard && (
        <Button asChild variant="outline" className="w-full border-gray-300 text-gray-800 hover:bg-gray-50 hover:text-gray-950 md:w-auto">
          <Link href="/app">
            <Download className="mr-2 h-4 w-4" />
            Continue with Nookix App
          </Link>
        </Button>
      )}
      {book?.is_amazon_buy && book.amazon_url && (
        <Button variant="outline" onClick={handleAmazonPurchase}>
          <Image src="/amazon_buy.png" alt="Amazon" width={32} height={32} className="mr-2" />
          Shop Now
        </Button>
      )}
    </div>
  )

  // Parse module data
  const parseJsonArray = (field: any): any[] => {
    if (!field) return []
    if (Array.isArray(field)) return field
    
    if (typeof field === 'string') {
      // Try to parse the string
      try {
        const parsed = JSON.parse(field)
        // If parsed result is an array, return it
        if (Array.isArray(parsed)) return parsed
        // If parsed result is a string (double-encoded), try parsing again
        if (typeof parsed === 'string') {
          try {
            const doubleParsed = JSON.parse(parsed)
            return Array.isArray(doubleParsed) ? doubleParsed : [doubleParsed]
          } catch {
            return [parsed]
          }
        }
        // If parsed result is an object, wrap it in an array
        return [parsed]
      } catch (e) {
        console.warn('[parseJsonArray] Failed to parse string:', field.substring(0, 100), e)
        return []
      }
    }
    
    if (typeof field === 'object') {
      // If it's already an object but not an array, wrap it in an array
      return [field]
    }
    
    return []
  }

  const whatYouWillGet = parseJsonArray(book?.what_you_will_get)
  const targetAudience = parseJsonArray(book?.target_audience)

  // Build table of contents based on available modules
  const tocSections = [
    { id: 'book-summaries', title: 'Book Summary' },
    !isDashboard && book?.summary_preview && { id: 'summary-preview', title: 'Summary Preview' },
    book?.description && { id: 'about-the-book', title: 'About the Book' },
    book?.key_takeaways && { id: 'key-takeaways', title: 'Key Takeaways' },
    targetAudience.length > 0 && { id: 'who-should-listen', title: 'Who Should Listen?' },
    book?.author_bio && { id: 'about-author', title: 'About the Author' },
    { id: 'you-may-also-like', title: 'You May Also Like' },
    { id: 'related-topics', title: 'Related Topics' },
    !isDashboard && { id: 'popular-books', title: 'Popular Books' },
  ].filter(Boolean) as { id: string; title: string }[]

  const isDashboardCurrentBook = isDashboard && currentBook?.id === book?.id
  const hasTimelinePlaybackSession = isDashboard ? isDashboardCurrentBook : Boolean(previewAudioRef.current?.src)
  const timelinePlaybackTime = isDashboardCurrentBook ? currentTime : previewCurrentTime
  const isTimelineAudioPlaying = isDashboard ? Boolean(isDashboardCurrentBook && isPlaying) : isPreviewPlaying

  const audioSummaryPortal = (
    <>
      <Card id="book-summaries" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
        <CardHeader className="px-0 pt-0 pb-4 md:px-6 md:pt-2 md:pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Book Summary</h2>
            {book?.audio_hosts && (
              <p className="text-sm text-gray-600">
                Narrator: {book.audio_hosts}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        <div className="space-y-3">
          {/* 统一的波形渲染组件 */}
          {(() => {
            const renderWaveform = (isPlaying: boolean = false) => (
              <div className="flex items-center gap-[3px] h-6 w-full overflow-hidden">
                {/* Inject custom keyframes for the wave animation */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                  @keyframes activeWave {
                    0% { transform: scaleY(1); }
                    20% { transform: scaleY(1.6); }
                    40% { transform: scaleY(0.6); }
                    60% { transform: scaleY(1.4); }
                    80% { transform: scaleY(0.8); }
                    100% { transform: scaleY(1); }
                  }
                `}} />
                {[...Array(60)].map((_, i) => {
                  // Responsive Visibility Logic
                  // 0-24: Always visible (Mobile base)
                  // 25-39: Visible on Tablet+ (sm)
                  // 40-59: Visible on Desktop+ (lg)
                  let visibilityClass = "block"
                  if (i >= 25 && i < 40) visibilityClass = "hidden sm:block"
                  else if (i >= 40) visibilityClass = "hidden lg:block"
                  
                  // Generate deterministic pseudo-random values for animation
                  const duration = 0.8 + ((i * 7) % 8) * 0.1 // 0.8s - 1.5s
                  const delay = -((i * 13) % 10) * 0.2 // delay 0s - 2s reversed
                  
                  return (
                    <div
                      key={i}
                      className={`w-[4px] sm:w-[5px] rounded-full transition-all duration-300 flex-shrink-0 ${visibilityClass} ${
                        isPlaying ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{
                        // Hydration Fix: Use deterministic values based on index instead of Math.random()
                        // Waveform Shape: Simulate realistic audio wave using combined sine waves
                        height: `${Math.max(15, 20 + Math.abs(Math.sin(i * 0.15)) * 45 + Math.abs(Math.cos(i * 0.37)) * 25)}%`,
                        // Adjusted opacity logic: Inactive bars are lighter
                        opacity: 0.6 + (((i * 5 + 3) % 40) / 100),
                        // Add animation when playing - use complete animation property to avoid conflicts
                        animation: isPlaying ? `activeWave ${duration}s ease-in-out ${delay}s infinite` : 'none',
                      }}
                    />
                  )
                })}
              </div>
            )

            return chapters.length > 0 ? (
              // 有 chapters：显示实际的音频波形
              chapters.map((chapter, index) => {
                // 检查当前章节是否正在播放
                const isCurrentTrack = currentBook?.id === book?.id && currentTrack?.id === chapter.id
                const isCurrentlyPlaying = isCurrentTrack && isPlaying

            return (
              <div
                key={chapter.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer group border bg-gray-100 border-transparent hover:bg-gray-200`}
                onClick={() => {
                  // 如果当前是这本书的这个章节，则只切换播放/暂停
                  if (isCurrentTrack) {
                    togglePlay()
                    return
                  }
                  
                  // 如果在 Dashboard 中且提供了 onPlayFromDashboard，直接播放
                  if (onPlayFromDashboard) {
                    onPlayFromDashboard()
                    return
                  }
                  
                  // 否则，调用 handlePlayNow 来处理播放逻辑
                  // 这会根据用户状态和是否有预览音频来决定行为
                  handlePlayNow()
                }}
              >
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  {/* Play Button Circle */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 bg-white text-gray-900`}>
                    {isCurrentlyPlaying ? (
                      <Pause className="h-5 w-5" fill="currentColor" />
                    ) : (
                      <Play className="h-5 w-5 ml-1" fill="currentColor" />
                    )}
                  </div>

                  {/* Waveform only - No Title */}
                  <div className="flex flex-col justify-center min-w-0 flex-1 h-10 overflow-hidden">
                    {renderWaveform(isCurrentlyPlaying)}
                  </div>
                </div>

                {/* Duration / Progress */}
                <div className="flex items-center pl-4 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md text-gray-500 bg-white/50`}>
                    {book?.audio_duration ? formatDuration(book.audio_duration) : '--:--'}
                  </span>
                </div>
              </div>
            )
          })
          ) : (
            // 没有 chapters：显示占位波形（官网页面）
            <div
              className="flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer group border bg-gray-100 border-transparent hover:bg-gray-200"
              onClick={() => {
                if (!isDashboard) {
                  if (isPreviewPlaying && previewAudioRef.current) {
                    previewAudioRef.current.pause()
                    setIsPreviewPlaying(false)
                    console.log('[官网] 暂停预览音频')
                    return
                  }

                  if (previewAudioRef.current?.src && previewAudioRef.current.currentTime > 0) {
                    previewAudioRef.current.play()
                      .then(() => setIsPreviewPlaying(true))
                      .catch((error) => {
                        console.error('[官网] 恢复预览音频失败:', error)
                        setIsPreviewPlaying(false)
                      })
                    return
                  }
                }

                if (isDashboardCurrentBook) {
                  togglePlay()
                  return
                }

                handlePlayNow()
              }}
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                {/* Play Button Circle */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 bg-white text-gray-900">
                  {isTimelineAudioPlaying ? (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  ) : (
                    <Play className="h-5 w-5 ml-1" fill="currentColor" />
                  )}
                </div>

                {/* 统一使用 renderWaveform，不带动画 */}
                <div className="flex flex-col justify-center min-w-0 flex-1 h-10 overflow-hidden">
                  {renderWaveform(!isDashboard && isPreviewPlaying)}
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-center pl-4 flex-shrink-0">
                <span className="text-xs font-semibold px-2 py-1 rounded-md text-gray-500 bg-white/50">
                  {book?.audio_duration ? formatDuration(book.audio_duration) : '--:--'}
                </span>
              </div>
            </div>
          )
          })()}
        </div>
        
        {/* Audio Timeline - 紧跟在音频播放器下方 */}
        {book?.timeline && Array.isArray(book.timeline) && book.timeline.length > 0 && (
          <AudioTimeline 
            timeline={book.timeline}
            bookId={bookId}
            isAuthenticated={isUserLoggedIn}
            isPremium={isPremium}
            isBookPremium={Boolean(book.is_premium || book.isPremium)}
            playbackTime={timelinePlaybackTime}
            hasActivePlaybackSession={hasTimelinePlaybackSession}
            isAudioPlaying={isTimelineAudioPlaying}
            onSectionPlay={(startTime) => {
              if (isDashboard && isDashboardCurrentBook) {
                seekTo(startTime)
                if (!isPlaying) togglePlay()
                return
              }
              void handlePlayNow(startTime)
            }}
            onTogglePlay={() => {
              if (!isDashboard) {
                if (isPreviewPlaying && previewAudioRef.current) {
                  previewAudioRef.current.pause()
                  setIsPreviewPlaying(false)
                  return
                }

                if (previewAudioRef.current?.src) {
                  previewAudioRef.current.play()
                    .then(() => setIsPreviewPlaying(true))
                    .catch((error) => {
                      console.error('[官网] 切换预览音频失败:', error)
                      setIsPreviewPlaying(false)
                    })
                }
                return
              }

              togglePlay()
            }}
            onUnlockClick={() => {
              if (!isUserLoggedIn) {
                const bookSlug = book.slug
                localStorage.setItem('redirectAfterLogin', `/dashboard/book/${bookSlug}`)
                setShowLoginDialog(true)
              } else {
                setShowMembershipDialog(true)
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  </>
  )

  return (
    <>
      <Portal selector="#book-header-actions-portal">{headerActionsPortal}</Portal>
      <BookTocPortal sections={tocSections} />

      <div className="space-y-8 md:space-y-8">
        {/* Mobile Table of Contents - Only visible on mobile */}
        <TableOfContentsMobile sections={tocSections} />

        {/* Nook Talks - Audio Summary */}
        {audioSummaryPortal}

        {/* Summary Preview - 仅官网显示 */}
        {!isDashboard && book?.summary_preview && (
          <SummaryPreviewSection
            summaryPreview={book.summary_preview}
            bookSlug={book.slug}
          />
        )}

        {/* About the Book (Description) */}
        {book?.description && (
          <Card id="about-the-book" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
            <CardHeader className="px-0 pt-0 pb-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">About the Book</h2>
            </CardHeader>
            <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
              <RichText content={book.description} />
            </CardContent>
          </Card>
        )}

        {/* Key Takeaways */}
        {book?.key_takeaways && <KeyTakeawaysSection content={book.key_takeaways} />}

        {/* Who Should Listen? */}
        {targetAudience.length > 0 && <TargetAudienceSection audience={targetAudience} />}

        {/* About the Author */}
        {book?.author_bio && <AuthorBioSection bio={book.author_bio} authorName={getAuthorName(book)} />}

        {/* You May Also Like */}
        <BookCarouselWithHeader
          id="you-may-also-like"
          title="You May Also Like"
          books={relatedBooks}
          isFetching={null}
        />

        {/* Related Topics */}
        {genres.length > 0 && (
          <Card id="related-topics" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
            <CardHeader className="px-0 pt-0 pb-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Related Topics</h2>
            </CardHeader>
            <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {genres.filter((tag, idx, self) => idx === self.findIndex(t => t.slug === tag.slug)).map((genre) => (
                  <span 
                    key={genre.slug}
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] font-medium text-slate-600 bg-white ring-1 ring-black/[0.06] hover:ring-blue-300 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                    onClick={() => handleGenreClick(genre.title)}
                  >
                    {(genre as any).icon_emoji && (
                      <span className="text-base">{(genre as any).icon_emoji}</span>
                    )}
                    {genre.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Popular Books - 仅在官网显示 */}
        {!isDashboard && popularBooks.length > 0 && (
          <BookCarouselWithHeader
            id="popular-books"
            title="Popular Books"
            books={popularBooks}
            isFetching={null}
          />
        )}
      </div>

      <PremiumConfirmationDialog 
        isOpen={showMembershipDialog} 
        onClose={() => setShowMembershipDialog(false)}
        alignForDashboard={true}
      />
      <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} onSuccess={handleLoginSuccess} />
    </>
  )
}

// 抽出的独立组件，使用 memo 保证在 props 不变时不重复渲染
const BookCard = memo(({ book: cardBook, isFetching, onPlay }: { book: any, isFetching: boolean, onPlay: (book: any) => void }) => {
  return (
    <div className="relative group">
      <Link href={`/book/${cardBook.slug}`} className="block outline-none">
        <div className="flex flex-col">
          <div className="relative mb-4">
            <div className="absolute -inset-2 rounded-[24px] bg-slate-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:ring-black/[0.08] isolate">
              <Image
                src={cardBook.cover_image || '/placeholder.svg'}
                alt={cardBook.title || 'Nookix Cover'}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 200px"
                className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
              />
            </div>
          </div>
          <div className="px-1 relative z-10 space-y-2">
            <h3 className="line-clamp-2 text-balance text-[14px] font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[15px]">{cardBook.title}</h3>
            <p className="line-clamp-1 text-[13px] font-medium text-slate-600">{getAuthorName(cardBook)}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                <span>{cardBook.audio_duration ? `${Math.ceil(cardBook.audio_duration / 60)}min` : '30min'}</span>
              </div>
              {cardBook.rating > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-gray-500">{cardBook.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
})
BookCard.displayName = 'BookCard'