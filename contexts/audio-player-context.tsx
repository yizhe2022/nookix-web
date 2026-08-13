"use client"

import React, { createContext, useContext, useRef, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { updateReadingHistory } from "@/lib/reading-history-service"
import { 
  cleanupExpiredCache, 
  clearAllCachedUrls,
} from "@/lib/audio-auth-api"
import { hasActiveSubscription } from "@/types/subscription"

// 音频轨道接口（原 Chapter 概念）
// Migration Note: This interface now represents virtual tracks generated from summary_audio field
interface AudioTrack {
  id: string | number           // Format: "summary_1", "summary_2", etc. for virtual tracks
  title: string                 // "Full Summary" or "Section N"
  duration: string              // Duration calculated dynamically
  isPremium?: boolean           // Inherited from book.isPremium
  is_free?: boolean             // DEPRECATED: Always false in new model (book-level permission)
  audio_file?: string           // Audio filename from summary_audio
  chapter_duration_seconds?: number
  order?: number
  is_from_book?: boolean        // Flag indicating this is a virtual track
}

// 向后兼容的类型别名（将在重构完成后移除）
// @deprecated Use AudioTrack instead
type Chapter = AudioTrack

const DEBUG_AUDIO_LOGS = process.env.NODE_ENV !== 'production'

function isSignedWorkerAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.pathname.startsWith('/pbc_') &&
      !!parsed.searchParams.get('sig') &&
      !!parsed.searchParams.get('exp')
  } catch {
    return false
  }
}

interface Book {
  id: string
  title: string
  author: string
  cover: string
  slug?: string                      // Book slug for URL generation
  summary_audio?: string | string[]  // NEW: Direct audio field from backend
  audioDurationSeconds?: number      // Full book duration from books.audio_duration, used as UI fallback
  tracks?: AudioTrack[]              // NEW: Virtual tracks (generated from summary_audio)
  chapters: AudioTrack[]             // DEPRECATED: Kept for backward compatibility
  isPremium?: boolean
  book_transcript?: any              // Book transcript for playback limit calculation
}

// 播放记录接口
interface PlaybackRecord {
  bookId: string
  chapterId: string | number
  position: number
  timestamp: number
}

// 游客播放进度接口
interface GuestPlaybackProgress {
  bookId: string
  bookSlug: string
  position: number  // 播放位置（秒）
  progress: number  // 进度百分比 (0-1)
  timestamp: number // 最后播放时间戳
}

// 音频播放器状态接口
interface AudioPlayerState {
  currentBook: Book | null
  currentTrack: Chapter | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRecords: PlaybackRecord[]
  isPlayerVisible: boolean
  isUserPremium: boolean
  showPremiumDialog: boolean
  showLoginDialog: boolean
  showSignupDialog: boolean
  isUserLoggedIn: boolean
  toastMessage: string | null
  playlist: Book[] // 新增：播放列表
  currentPlaylistIndex: number // 新增：当前播放列表索引
  pendingPlayAction: { book: Book; trackId?: string | number } | null // 新增：待播放的书籍
  playbackLimit: number | null // 新增：播放限制时间（秒），null 表示无限制
  audioSource: 'preview' | 'full' // 新增：音频源类型
  onLimitReachedCallback: (() => void) | null // 新增：达到限制时的回调
}

// Context类型接口
interface AudioPlayerContextType extends AudioPlayerState {
  playBook: (book: Book, chapterId?: string | number, fromStart?: boolean, options?: {
    playbackLimit?: number | null
    audioSource?: 'preview' | 'full'
    onLimitReached?: () => void
    startTime?: number
  }) => void
  playTrack: (book: Book, chapterId: string | number) => void
  togglePlay: () => void
  seekTo: (time: number) => void
  nextTrack: () => void
  previousTrack: () => void
  playNextBookInPlaylist: () => void
  playPreviousBookInPlaylist: () => void
  updatePlaybackRecord: (book?: Book | null, chapter?: Chapter | null, currentTimeOverride?: number, durationOverride?: number) => void
  hidePlayer: () => void
  showPlayer: () => void
  restoreLastPlayedBook: (book: Book, position: number) => void
  stopAndResetPlayer: () => void
  setUserPremium: (isPremium: boolean) => void
  closePremiumDialog: () => void
  showPremiumUpgrade: () => void
  openLoginDialog: () => void
  closeLoginDialog: () => void
  openSignupDialog: () => void
  closeSignupDialog: () => void
  isUserLoggedIn: boolean
  setUserLoggedIn: (isLoggedIn: boolean) => void
  showToast: (message: string) => void
  hideToast: () => void
  setAudioRef: (ref: HTMLAudioElement | null) => void
  setPlaybackSpeed: (speed: number) => void
  addToPlaylist: (books: Book[]) => void // 新增：添加到播放列表
  clearPlaylist: () => void // 新增：清空播放列表
  removeFromPlaylist: (bookId: string) => void // 新增：从播放列表移除
  playFromPlaylist: (index: number) => void // 新增：播放列表中的指定书籍
  setPlaybackLimit: (limit: number | null) => void // 新增：设置播放限制
  setAudioSource: (source: 'preview' | 'full') => void // 新增：设置音频源
  setOnLimitReachedCallback: (callback: (() => void) | null) => void // 新增：设置限制回调
}

// 初始状态
const initialState: AudioPlayerState = {
  currentBook: null,
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRecords: [],
  isPlayerVisible: false,
  isUserPremium: false,
  showPremiumDialog: false,
  showLoginDialog: false,
  showSignupDialog: false,
  isUserLoggedIn: false,
  toastMessage: null,
  playlist: [], // 新增
  currentPlaylistIndex: -1, // 新增
  pendingPlayAction: null, // 新增
  playbackLimit: null, // 新增：播放限制
  audioSource: 'full', // 新增：音频源
  onLimitReachedCallback: null, // 新增：限制回调
}

/**
 * Parses the summary_audio field into virtual AudioTrack objects
 * 
 * This helper function handles the transition from chapter-based to single-audio model.
 * It creates virtual tracks from the summary_audio field to maintain backward compatibility.
 * 
 * @param bookData - Raw book data from PocketBase
 * @returns Array of virtual AudioTrack objects
 */
function parseSummaryAudio(bookData: any): AudioTrack[] {
  let summaryAudioList: string[] = []
  
  // Handle different formats of summary_audio field
  if (bookData.summary_audio) {
    if (Array.isArray(bookData.summary_audio)) {
      // Format 1: Array of audio files
      summaryAudioList = bookData.summary_audio
    } else if (typeof bookData.summary_audio === 'string') {
      const cleaned = bookData.summary_audio.trim()
      if (cleaned) {
        // Format 2: Comma-separated string
        // Format 3: Single string
        summaryAudioList = cleaned.includes(',')
          ? cleaned.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
          : [cleaned]
      }
    }
  }
  
  // Generate virtual tracks with predictable IDs
  if (summaryAudioList.length > 0) {
    return summaryAudioList.map((audioFile, index) => ({
      id: `summary_${index + 1}`,  // Predictable ID format: summary_1, summary_2, etc.
      title: summaryAudioList.length > 1 
        ? `Section ${index + 1}`    // Multiple files: "Section 1", "Section 2", etc.
        : 'Full Summary',            // Single file: "Full Summary"
      duration: "0:00",              // Duration calculated dynamically during playback
      is_free: false,                // Always false for new model (book-level permission)
      isPremium: bookData.is_premium,
      // Additional properties for compatibility
      audio_file: audioFile,
      chapter_duration_seconds: 0,
      order: index + 1,
      is_from_book: true             // Flag indicating this is a virtual track
    }))
  }

  if (bookData.id) {
    return [{
      id: 'summary_1',
      title: 'Full Summary',
      duration: '0:00',
      is_free: false,
      isPremium: bookData.is_premium,
      chapter_duration_seconds: 0,
      order: 1,
      is_from_book: true
    }]
  }
  
  // Return empty array for null/undefined/empty summary_audio
  return []
}

// 创建Context
const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AudioPlayerState>(() => {
    // 从 localStorage 恢复 playlist
    if (typeof window !== 'undefined') {
      try {
        const savedPlaylist = localStorage.getItem('nookix_playlist')
        if (savedPlaylist) {
          const parsed = JSON.parse(savedPlaylist)
          return {
            ...initialState,
            playlist: parsed.playlist || [],
            currentPlaylistIndex: parsed.currentPlaylistIndex || -1,
          }
        }
      } catch (e) {
        console.error('Failed to restore playlist from localStorage:', e)
      }
    }
    return initialState
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // 记录上次保存播放记录的时间
  const lastRecordRef = useRef<number>(0)

  // 使用全局 AuthContext
  const { user } = useAuth()

  // 使用 Ref 追踪用户状态，解决 handleTimeUpdate 闭包问题
  const isUserPremiumRef = useRef(false)
  const isUserLoggedInRef = useRef(false)
  const guestProgressSyncRef = useRef(false)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const authenticatedUserIdRef = useRef<string | null>(null)

  const syncGuestPlaybackProgress = async (userId: string) => {
    if (guestProgressSyncRef.current || typeof window === 'undefined') return

    const guestProgressStr = localStorage.getItem('nookix_guest_progress')
    if (!guestProgressStr) return

    guestProgressSyncRef.current = true

    try {
      const guestProgress: GuestPlaybackProgress = JSON.parse(guestProgressStr)
      const validPosition = Math.max(0, Math.floor(Number(guestProgress.position) || 0))
      const validProgress = Math.min(Math.max(Number(guestProgress.progress) || 0, 0), 1)

      if (!guestProgress.bookId || validPosition <= 0) {
        localStorage.removeItem('nookix_guest_progress')
        return
      }

      console.log('[游客进度同步] 发现游客播放进度:', {
        bookId: guestProgress.bookId,
        position: validPosition,
        progress: validProgress,
      })

      // 检查用户是否已有播放记录
      const supabase = createClient()
      const { data: existingRecords, error: checkError } = await supabase
        .from('playback_records')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (checkError) {
        console.error('[游客进度同步] 检查播放记录失败:', checkError)
        guestProgressSyncRef.current = false
        return
      }

      // 如果用户已有播放记录，不同步游客进度
      if (existingRecords && existingRecords.length > 0) {
        console.log('[游客进度同步] 用户已有播放记录，跳过同步')
        localStorage.removeItem('nookix_guest_progress')
        return
      }

      console.log('[游客进度同步] 用户无播放记录，开始同步游客进度')

      const result = await updateReadingHistory(
        guestProgress.bookId,
        validPosition,
        validProgress
      )

      if (result.success) {
        localStorage.removeItem('nookix_guest_progress')
        console.log('[游客进度同步] ✅ 已同步到数据库并清理 localStorage')
      } else {
        guestProgressSyncRef.current = false
        console.error('[游客进度同步] ⚠️ 同步失败:', result.message)
      }
    } catch (error) {
      guestProgressSyncRef.current = false
      console.error('[游客进度同步] 同步过程出错:', error)
    }
  }

  // 从 AuthContext 同步用户状态到 Refs 和 State
  useEffect(() => {
    const isLoggedIn = !!user
    
    isUserLoggedInRef.current = isLoggedIn
    
    if (user) {
      const supabase = createClient()
      ;(async () => {
        let isPremium = false

        try {
          const { data: subscriptionRows } = await supabase
            .from('user_subscriptions')
            .select('subscription_status, subscription_plan, end_date')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)

          const data = subscriptionRows?.[0] ?? null
          isPremium = hasActiveSubscription(
            data?.subscription_status || 'free',
            data?.subscription_plan || 'none',
            data?.end_date || null
          )
        } catch (error) {
          console.warn('[Audio Player] Failed to load subscription status:', error)
        }

        isUserPremiumRef.current = isPremium
        setState(prev => ({
          ...prev,
          isUserLoggedIn: true,
          isUserPremium: isPremium,
        }))

        await syncGuestPlaybackProgress(user.id)
      })()
    } else {
      guestProgressSyncRef.current = false
      isUserPremiumRef.current = false
      setState(prev => ({
        ...prev,
        isUserLoggedIn: false,
        isUserPremium: false,
      }))
    }
  }, [user])

  // 初始化 BroadcastChannel
  useEffect(() => {
    try {
      if ('BroadcastChannel' in window) {
        broadcastChannelRef.current = new BroadcastChannel('audio_player_channel')
        broadcastChannelRef.current.onmessage = (event) => {
          if (event.data.type === 'PLAY_TRIGGERED') {
            console.log('[Broadcast] Received PLAY_TRIGGERED from another tab, pausing...')
            if (audioRef.current && !audioRef.current.paused) {
              audioRef.current.pause()
              setState(prev => ({ ...prev, isPlaying: false }))
            } else {
              // 也确保状态为 paused
              setState(prev => ({ ...prev, isPlaying: false }))
            }
          }
        }
        console.log('[BroadcastChannel] Initialized successfully')
      } else {
        console.warn('[BroadcastChannel] Not supported in this browser, multi-tab sync disabled')
      }
    } catch (e) {
      console.error('[BroadcastChannel] Initialization failed:', e)
    }

    // 清理函数
    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close()
      }
    }
  }, [])

  // 广播播放事件到其他标签页
  const broadcastPlay = () => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'PLAY_TRIGGERED' })
        console.log('[Broadcast] Sent PLAY_TRIGGERED to other tabs')
      } catch (e) {
        console.error('[Broadcast] Failed to send message:', e)
      }
    }
  }

  // 检查用户是否可以播放音频轨道
  const canPlayTrack = (book: Book, track: Chapter): boolean => {
    // 如果书本是免费的，所有人都可以播放
    if (!book.isPremium) {
      return true
    }

    // 如果书本是 Premium：
    // - 所有用户都可以开始播放（试听 5 分钟）
    // - 5 分钟限制在 handleTimeUpdate 中处理
    // - 这里只返回 true，让用户可以点击播放按钮
    return true
  }

  // 显示会员确认对话框
  const showPremiumConfirmation = () => {
    setState(prev => ({
      ...prev,
      showPremiumDialog: true,
    }))
  }

  // 关闭会员对话框
  const closePremiumDialog = () => {
    setState(prev => ({
      ...prev,
      showPremiumDialog: false,
    }))
  }

  // 设置用户会员状态
  const setUserPremium = (isPremium: boolean) => {
    isUserPremiumRef.current = isPremium
    setState(prev => ({
      ...prev,
      isUserPremium: isPremium,
    }))
  }

  // 设置用户登录状态
  const setUserLoggedIn = (isLoggedIn: boolean) => {
    isUserLoggedInRef.current = isLoggedIn
    setState(prev => ({
      ...prev,
      isUserLoggedIn: isLoggedIn,
    }))
  }

  // 修正：updatePlaybackRecord 支持传递最新 currentTime/duration，避免闭包陷阱
  const updatePlaybackRecord = async (
    bookParam?: Book | null,
    chapterParam?: Chapter | null,
    currentTimeOverride?: number,
    durationOverride?: number,
    retryCount = 0
  ) => {
    const book = bookParam || state.currentBook
    const chapter = chapterParam || state.currentTrack
    const currentTime = typeof currentTimeOverride === 'number' ? currentTimeOverride : state.currentTime
    const duration = typeof durationOverride === 'number' ? durationOverride : state.duration
    if (DEBUG_AUDIO_LOGS) {
      console.log('[播放记录] 进入 updatePlaybackRecord', {
        bookId: book?.id,
        chapterId: chapter?.id,
        isUserLoggedIn: state.isUserLoggedIn
      })
      console.log('[播放记录][详细日志] currentTime:', currentTime, 'duration:', duration, 'retryCount:', retryCount)
    }
    
    // 如果没有书籍或章节，无法保存
    if (!book || !chapter) {
      if (DEBUG_AUDIO_LOGS) {
        console.log('[播放记录] 缺少书籍或章节信息')
      }
      return
    }

    // 参数校验和详细日志
    const bookId = book.id
    const chapterId = String(chapter.id)
    const position = Math.floor(currentTime)

    // 计算当前音频轨道的进度 (0-1)
    const trackProgress = duration > 0 ? (currentTime / duration) : 0

    // 计算整本书的进度
    // 由于后端没有存储每个音频轨道的时长，我们无法精确计算基于时间权重的总进度
    // 这里采用"音频轨道权重均等"的策略：总进度 = (已完成轨道数 + 当前轨道进度) / 总轨道数
    let totalProgress = 0
    if (book.chapters && book.chapters.length > 0) {
      const currentTrackIndex = book.chapters.findIndex(ch => String(ch.id) === String(chapter.id))
      if (currentTrackIndex !== -1) {
        totalProgress = (currentTrackIndex + trackProgress) / book.chapters.length
      } else {
        // 如果找不到音频轨道，回退到单轨道逻辑
        totalProgress = trackProgress
      }
    } else {
      totalProgress = trackProgress
    }

    if (DEBUG_AUDIO_LOGS) {
      console.log('[播放记录][详细日志] 计算参数', { bookId, chapterId, position, trackProgress, totalProgress })
    }
    if (!bookId || typeof bookId !== 'string') {
      console.error('[播放记录] bookId 无效', { bookId })
      return
    }
    // 注意：chapterId 不再需要，因为一本书只有一个音频
    if (typeof position !== 'number' || isNaN(position)) {
      console.error('[播放记录] position 无效', { position })
      return
    }
    if (typeof totalProgress !== 'number' || isNaN(totalProgress)) {
      console.error('[播放记录] totalProgress 无效', { totalProgress })
      return
    }

    // 如果用户已登录，保存到数据库
    if (isUserLoggedInRef.current) {
      if (DEBUG_AUDIO_LOGS) {
        console.log('[播放记录] 用户已登录，保存到数据库:', { bookId, position, totalProgress })
      }
      try {
        const result = await updateReadingHistory(bookId, position, totalProgress)
        if (DEBUG_AUDIO_LOGS) {
          console.log('[播放记录] updateReadingHistory 返回:', result)
        }
        // 自动刷新 library 页面进度
        if (typeof window !== 'undefined' && result.success && typeof (window as any).refreshLibraryBooks === 'function') {
          (window as any).refreshLibraryBooks();
        }
        setState(prev => ({
          ...prev,
          playbackRecords: [
            ...prev.playbackRecords,
            {
              bookId: book.id,
              chapterId: chapter.id,
              position: currentTime,
              timestamp: Date.now(),
            },
          ],
        }))
      } catch (error) {
        console.error('[播放记录] 保存失败:', error)
        
        // 重试机制（最多重试 3 次）
        if (retryCount < 3) {
          const nextRetry = retryCount + 1
          const delay = 1000 * nextRetry // 指数退避：1s, 2s, 3s
          console.log(`[播放记录] 将在 ${delay}ms 后重试 (${nextRetry}/3)`)
          setTimeout(() => {
            updatePlaybackRecord(bookParam, chapterParam, currentTimeOverride, durationOverride, nextRetry)
          }, delay)
        } else {
          console.error('[播放记录] 重试次数已用尽，放弃保存')
        }
      }
    } else {
      // 游客用户，保存到 localStorage
      if (typeof window !== 'undefined' && position > 0) {
        try {
          const guestProgress: GuestPlaybackProgress = {
            bookId: book.id,
            bookSlug: book.slug || '',
            position: position,
            progress: totalProgress,
            timestamp: Date.now()
          }
          localStorage.setItem('nookix_guest_progress', JSON.stringify(guestProgress))
          if (DEBUG_AUDIO_LOGS) {
            console.log('[播放记录] 游客进度已保存到 localStorage:', guestProgress)
          }
        } catch (error) {
          console.error('[播放记录] 保存游客进度到 localStorage 失败:', error)
        }
      }
    }
  }

  // 隐藏播放器
  const hidePlayer = () => {
    setState(prev => ({
      ...prev,
      isPlayerVisible: false,
    }))
  }

  // 显示播放器
  const showPlayer = () => {
    setState(prev => ({
      ...prev,
      isPlayerVisible: true,
    }))
  }

  // 恢复最后阅读书籍时只恢复可见状态和进度，不自动申请签名 URL 或播放。
  const restoreLastPlayedBook = React.useCallback((book: Book, position: number) => {
    const tracks = book.chapters?.length ? book.chapters : parseSummaryAudio(book)
    const track = tracks[0]

    if (!track) return

    setState(prev => {
      if (prev.currentBook || prev.isPlaying) return prev

      return {
        ...prev,
        currentBook: {...book, chapters: tracks, tracks},
        currentTrack: track,
        currentTime: Math.max(0, position),
        isPlaying: false,
        isPlayerVisible: true,
      }
    })
  }, [])

  // 身份变化时必须销毁受权限保护的媒体会话，而不只是隐藏播放条。
  const stopAndResetPlayer = React.useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }

    clearAllCachedUrls()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nookix_playlist')
    }
    setState(prev => ({
      ...initialState,
      isUserLoggedIn: prev.isUserLoggedIn,
      isUserPremium: prev.isUserPremium,
    }))
  }, [])

  useEffect(() => {
    const previousUserId = authenticatedUserIdRef.current
    const currentUserId = user?.id ?? null

    if (previousUserId && previousUserId !== currentUserId) {
      stopAndResetPlayer()
    }

    authenticatedUserIdRef.current = currentUserId
  }, [stopAndResetPlayer, user?.id])

  // 加载音频
  const loadAudio = async (
    chapter: Chapter,
    book: Book,
    startTime: number = 0,
    autoPlay: boolean = false,
    audioSource: 'preview' | 'full' = 'full'
  ) => {
    if (!audioRef.current) return

    const audio = audioRef.current

    try {
      if (DEBUG_AUDIO_LOGS) {
        console.log('[音频加载] ========== 开始加载音频 ==========')
        console.log('[音频加载] Book ID:', book.id)
        console.log('[音频加载] Book title:', book.title)
        console.log('[音频加载] Chapter ID:', chapter.id)
        console.log('[音频加载] Chapter title:', chapter.title)
        console.log('[音频加载] Auto Play:', autoPlay)
      }
      
      let audioUrl: string | null = null
      
      if (DEBUG_AUDIO_LOGS) {
        console.log('[音频加载] 使用预签名 URL 模式')
      }

      const response = await fetch('/api/audio-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, audioType: audioSource })
      })
      
      const data = await response.json().catch(() => null)
      if (response.ok && data?.url) {
        if (!isSignedWorkerAudioUrl(data.url)) {
          throw new Error('Audio API returned an unsigned URL')
        }

        audioUrl = data.url
        if (DEBUG_AUDIO_LOGS) {
          console.log('[音频加载] ✅ 获取预签名 URL 成功')
        }
      } else {
        const message = data?.message || data?.error || `HTTP ${response.status}`
        console.warn('[音频加载] 预签名 URL 请求失败:', message)
        throw new Error(`Failed to get signed audio URL: ${message}`)
      }
      
      if (!audioUrl) {
        throw new Error('Signed audio URL is required')
      }

      if (DEBUG_AUDIO_LOGS) {
        console.log('[音频加载] ✅ 音频 URL 已就绪')
        console.log('[音频加载] 开始加载音频')
      }
      
      audio.src = audioUrl
      audio.currentTime = startTime

      // 使用 oncanplay 替代 addEventListener 避免多次快速点击累积旧的监听器导致回退
      audio.oncanplay = () => {
        setState(prev => ({
          ...prev,
          duration: audio.duration || 0,
          currentTime: startTime,
        }))
        audio.oncanplay = null // 清除监听
        if (DEBUG_AUDIO_LOGS) {
          console.log('[音频加载] 音频元数据加载完成，duration:', audio.duration)
        }
        
        // 如果需要自动播放，在音频准备好后播放
        if (autoPlay) {
          if (DEBUG_AUDIO_LOGS) {
            console.log('[音频加载] 自动播放')
          }
          audio.play().catch((err) => {
            console.warn('Auto-play interrupted:', err)
            // 播放失败时更新状态
            setState(prev => ({ ...prev, isPlaying: false }))
          })
        }
      }

      audio.load()
    } catch (error) {
      console.error('[音频加载] ❌ 加载音频失败:', error)
      
      // 播放失败时更新状态
      setState(prev => ({ ...prev, isPlaying: false }))
      
      // 显示错误提示
      showToast('Failed to load audio. Please try again')
    }
  }

  // 播放书籍
  const playBook = async (
    book: Book, 
    trackId?: string | number, 
    fromStart?: boolean,
    options?: {
      playbackLimit?: number | null
      audioSource?: 'preview' | 'full'
      onLimitReached?: () => void
      startTime?: number
    }
  ) => {
    if (DEBUG_AUDIO_LOGS) {
      console.warn('🎵 [播放] 调用 playBook', { 
        bookId: book.id,
        bookTitle: book.title,
        trackId, 
        fromStart, 
        options,
        chaptersCount: book.chapters?.length,
        summaryAudio: Array.isArray(book.summary_audio) ? `[array:${book.summary_audio.length}]` : (book.summary_audio ? '[set]' : null),
        firstChapter: book.chapters?.[0] ? {
          id: book.chapters[0].id,
          title: book.chapters[0].title,
          audioFile: book.chapters[0].audio_file ? '[set]' : null
        } : null
      })
    }
    
    const requestedAudioSource = options?.audioSource || 'full'

    // 设置播放选项；同时清零 duration，避免上一次音频（如 preview）的旧时长
    // 在新音频 loadedmetadata 触发前残留，导致播放条显示错误时长
    if (options) {
      setState(prev => ({
        ...prev,
        playbackLimit: options.playbackLimit !== undefined ? options.playbackLimit : null,
        audioSource: requestedAudioSource,
        onLimitReachedCallback: options.onLimitReached || null,
        duration: 0,
      }))
    } else {
      // 重置为默认值
      setState(prev => ({
        ...prev,
        playbackLimit: null,
        audioSource: 'full',
        onLimitReachedCallback: null,
        duration: 0,
      }))
    }
    
    // 检查用户登录状态
    // 如果是预览音频（audioSource === 'preview'），允许未登录用户播放
    const isPreviewMode = options?.audioSource === 'preview'
    
    if (!isUserLoggedInRef.current && !isPreviewMode) {
      console.log('[播放] 用户未登录且非预览模式，显示注册弹窗并保存待播放动作')
      setState(prev => ({ 
        ...prev, 
        showSignupDialog: true,
        pendingPlayAction: { book, trackId }
      }))
      return
    }
    
    if (!isUserLoggedInRef.current && isPreviewMode) {
      console.warn('🎵 [播放] 用户未登录但是预览模式，允许播放')
    }
    
    // Generate virtual tracks from summary_audio if chapters array is empty
    let tracks = book.chapters
    if (DEBUG_AUDIO_LOGS) {
      console.warn('🎵 [播放] 检查 chapters:', { 
        hasChapters: !!tracks, 
        chaptersLength: tracks?.length,
        isPreviewMode 
      })
    }
    
    if (!tracks || tracks.length === 0) {
      if (DEBUG_AUDIO_LOGS) {
        console.warn('🎵 [播放] chapters 为空，从 summary_audio 生成虚拟 tracks')
      }
      tracks = parseSummaryAudio(book)
      // Update book object with virtual tracks for consistency
      book.chapters = tracks
      book.tracks = tracks
      if (DEBUG_AUDIO_LOGS) {
        console.warn('🎵 [播放] 生成的 tracks:', tracks)
      }
    } else {
      if (DEBUG_AUDIO_LOGS) {
        console.warn('🎵 [播放] 使用现有 chapters:', tracks.map(track => ({
          id: track.id,
          title: track.title,
          audioFile: track.audio_file ? '[set]' : null
        })))
      }
    }
    
    const targetTrack = trackId
      ? tracks.find(ch => ch.id === trackId)
      : tracks[0]
    
    if (DEBUG_AUDIO_LOGS) {
      console.warn('🎵 [播放] 目标 track:', {
        trackId: targetTrack?.id,
        title: targetTrack?.title,
        audioFile: targetTrack?.audio_file ? '[set]' : null
      })
    }
    
    if (!targetTrack) return
    if (!canPlayTrack(book, targetTrack)) {
      showPremiumConfirmation()
      return
    }
    
    // 获取用户的播放进度
    let startTime = Math.max(0, options?.startTime ?? 0)
    if (options?.startTime === undefined && !fromStart && isUserLoggedInRef.current) {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: historyRecords } = await supabase
            .from('user_reading_history')
            .select('current_position')
            .eq('user_id', user.id)
            .eq('book_id', book.id)
            .order('updated_at', { ascending: false })
            .limit(1)
          
          if (historyRecords && historyRecords.length > 0) {
            startTime = historyRecords[0].current_position || 0
            if (DEBUG_AUDIO_LOGS) {
              console.log('[播放] 从上次播放位置继续:', startTime, '秒')
            }
          }
        }
      } catch (error) {
        console.error('[播放] 获取播放进度失败:', error)
      }
    }
    
    setState(prev => ({
      ...prev,
      currentBook: book,
      currentTrack: targetTrack,
      isPlayerVisible: true,
      isPlaying: true,
    }))
    broadcastPlay()
    // 传递 startTime 和 autoPlay=true
    loadAudio(targetTrack, book, startTime, true, requestedAudioSource)
  }

  // 播放音频轨道
  const playTrack = (book: Book, trackId: string | number) => {
    if (DEBUG_AUDIO_LOGS) {
      console.log('[播放] 调用 playTrack', { bookId: book.id, bookTitle: book.title, trackId })
    }
    
    // ✅ 新增：未登录用户点击播放时立即触发注册弹窗
    if (!isUserLoggedInRef.current) {
      console.log('[播放] 用户未登录，显示注册弹窗并保存待播放动作')
      setState(prev => ({ 
        ...prev, 
        showSignupDialog: true,
        pendingPlayAction: { book, trackId }
      }))
      return
    }
    
    // Generate virtual tracks from summary_audio if chapters array is empty
    let tracks = book.chapters
    if (!tracks || tracks.length === 0) {
      tracks = parseSummaryAudio(book)
      // Update book object with virtual tracks for consistency
      book.chapters = tracks
      book.tracks = tracks
    }
    
    const track = tracks.find(ch => ch.id === trackId)
    if (!track) return
    if (!canPlayTrack(book, track)) {
      showPremiumConfirmation()
      return
    }
    setState(prev => ({
      ...prev,
      currentBook: book,
      currentTrack: track,
      isPlayerVisible: true,
      isPlaying: true,
    }))
    broadcastPlay()
    // 传递 autoPlay=true，让 loadAudio 在音频准备好后自动播放
    loadAudio(track, book, undefined, true, state.audioSource)
    // ❌ 删除立即保存：避免创建无意义的 0 进度记录
    // updatePlaybackRecord(book, track)
  }

  // 切换播放状态
  const togglePlay = () => {
    if (audioRef.current) {
      // 先检查当前播放状态，再更新
      const willPlay = !state.isPlaying
      
      setState(prev => ({
        ...prev,
        isPlaying: willPlay,
      }))

      if (willPlay) {
        const existingAudioSrc = audioRef.current.currentSrc || audioRef.current.getAttribute('src') || ''
        if (existingAudioSrc && !isSignedWorkerAudioUrl(existingAudioSrc)) {
          audioRef.current.pause()
          audioRef.current.removeAttribute('src')
          audioRef.current.load()
        }

        if (!audioRef.current.hasAttribute('src') && state.currentBook && state.currentTrack) {
          if (!canPlayTrack(state.currentBook, state.currentTrack)) {
            setState(prev => ({...prev, isPlaying: false}))
            showPremiumConfirmation()
            return
          }

          broadcastPlay()
          void loadAudio(
            state.currentTrack,
            state.currentBook,
            state.currentTime,
            true,
            state.audioSource
          )
          return
        }

        // 开始播放
        broadcastPlay()
        audioRef.current.play().catch(error => {
          console.warn('Playback interrupted during toggle:', error)
          // 播放失败时恢复状态
          setState(prev => ({
            ...prev,
            isPlaying: false,
          }))
        })
      } else {
        // 暂停播放
        audioRef.current.pause()
      }
    }
  }

  // 跳转到指定时间
  const seekTo = (time: number) => {
    const requestedTime = Math.max(0, time)
    const mediaDuration = audioRef.current?.duration && audioRef.current.duration > 0
      ? audioRef.current.duration
      : state.duration > 0
        ? state.duration
        : 0
    const isPremiumPreview = state.audioSource === 'preview' &&
      state.currentBook?.isPremium &&
      !isUserPremiumRef.current

    if (isPremiumPreview && mediaDuration > 0 && requestedTime > mediaDuration) {
      audioRef.current?.pause()
      if (!isUserLoggedInRef.current) {
        setState(prev => ({ ...prev, showLoginDialog: true }))
      } else {
        showPremiumConfirmation()
      }
      return
    }

    const nextTime = mediaDuration > 0 ? Math.min(requestedTime, mediaDuration) : requestedTime

    setState(prev => ({
      ...prev,
      currentTime: nextTime,
    }))

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  // 显示toast消息
  const showToast = (message: string) => {
    setState(prev => ({
      ...prev,
      toastMessage: message,
    }))

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        toastMessage: null,
      }))
    }, 3000)
  }

  // 下一个音频轨道
  const nextTrack = () => {
    if (!state.currentBook || !state.currentTrack) return
    const currentIndex = state.currentBook.chapters.findIndex((ch) => ch.id === state.currentTrack!.id)
    const nextAudioTrack = state.currentBook.chapters[currentIndex + 1]
    if (nextAudioTrack) {
      // 直接调用playTrack，内部已做权限判断
      playTrack(state.currentBook, nextAudioTrack.id)
    } else {
      showToast("No more tracks available")
    }
  }

  // 上一个音频轨道
  const previousTrack = () => {
    if (!state.currentBook || !state.currentTrack) return
    const currentIndex = state.currentBook.chapters.findIndex((ch) => ch.id === state.currentTrack!.id)
    const previousAudioTrack = state.currentBook.chapters[currentIndex - 1]
    if (previousAudioTrack) {
      // 直接调用playTrack，内部已做权限判断
      playTrack(state.currentBook, previousAudioTrack.id)
    } else {
      showToast("Already at the first track")
    }
  }

  // 下一本加入书架的书
  const playNextBookInPlaylist = async () => {
    if (!state.currentBook || !state.isUserLoggedIn) {
      showToast("Unable to find next book in playlist")
      return
    }
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data: libraryRecords } = await supabase
        .from('user_library')
        .select('book_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!libraryRecords || libraryRecords.length === 0) {
        showToast("No books in your library")
        return
      }

      const currentIndex = libraryRecords.findIndex(r => r.book_id === state.currentBook!.id)
      if (currentIndex === -1 || currentIndex === libraryRecords.length - 1) {
        showToast("No more books in your playlist")
        return
      }

      const nextRecord = libraryRecords[currentIndex + 1]
      
      // Fetch book data
      const { data: bookData } = await supabase
        .from('books')
        .select('id, title, authors, cover_image, summary_audio, audio_duration, is_premium')
        .eq('id', nextRecord.book_id)
        .single()
      
      if (!bookData) {
        showToast("Failed to load next book")
        return
      }
      
      // Parse summary_audio into virtual tracks
      const virtualTracks = parseSummaryAudio(bookData)

      const audioBook: Book = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.authors || 'Unknown Author',
        cover: bookData.cover_image || '/placeholder.svg',
        summary_audio: bookData.summary_audio,  // NEW: Include summary_audio field
        audioDurationSeconds: typeof bookData.audio_duration === 'number' ? bookData.audio_duration : undefined,
        chapters: virtualTracks,                 // Backward compatibility
        tracks: virtualTracks,                   // NEW: Virtual tracks
        isPremium: bookData.is_premium
      }
      playBook(audioBook)
    } catch (e) {
      console.error(e)
      showToast("Failed to load next book")
    }
  }

  // 上一本加入书架的书
  const playPreviousBookInPlaylist = async () => {
    if (!state.currentBook || !state.isUserLoggedIn) {
      showToast("Unable to find previous book in playlist")
      return
    }
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { data: libraryRecords } = await supabase
        .from('user_library')
        .select('book_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!libraryRecords || libraryRecords.length === 0) {
        showToast("No books in your library")
        return
      }

      const currentIndex = libraryRecords.findIndex(r => r.book_id === state.currentBook!.id)
      if (currentIndex === -1 || currentIndex === 0) {
        showToast("Already at the top of your playlist")
        return
      }

      const prevRecord = libraryRecords[currentIndex - 1]
      
      // Fetch book data
      const { data: bookData } = await supabase
        .from('books')
        .select('id, title, authors, cover_image, summary_audio, audio_duration, is_premium')
        .eq('id', prevRecord.book_id)
        .single()
      
      if (!bookData) {
        showToast("Failed to load previous book")
        return
      }
      
      // Parse summary_audio into virtual tracks
      const virtualTracks = parseSummaryAudio(bookData)

      const audioBook: Book = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.authors || 'Unknown Author',
        cover: bookData.cover_image || '/placeholder.svg',
        summary_audio: bookData.summary_audio,  // NEW: Include summary_audio field
        audioDurationSeconds: typeof bookData.audio_duration === 'number' ? bookData.audio_duration : undefined,
        chapters: virtualTracks,                 // Backward compatibility
        tracks: virtualTracks,                   // NEW: Virtual tracks
        isPremium: bookData.is_premium
      }
      playBook(audioBook)
    } catch (e) {
      console.error(e)
      showToast("Failed to load previous book")
    }
  }

  // 添加到播放列表
  const addToPlaylist = (books: Book[]) => {
    setState(prev => {
      // 过滤掉已存在的书籍
      const existingIds = new Set(prev.playlist.map(b => b.id))
      const newBooks = books.filter(b => !existingIds.has(b.id))
      
      const newPlaylist = [...prev.playlist, ...newBooks]
      
      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nookix_playlist', JSON.stringify({
            playlist: newPlaylist,
            currentPlaylistIndex: prev.currentPlaylistIndex
          }))
        } catch (e) {
          console.error('Failed to save playlist to localStorage:', e)
        }
      }
      
      return {
        ...prev,
        playlist: newPlaylist
      }
    })
  }

  // 清空播放列表
  const clearPlaylist = () => {
    setState(prev => ({
      ...prev,
      playlist: [],
      currentPlaylistIndex: -1
    }))
    
    // 清除 localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('nookix_playlist')
      } catch (e) {
        console.error('Failed to clear playlist from localStorage:', e)
      }
    }
  }

  // 从播放列表移除
  const removeFromPlaylist = (bookId: string) => {
    setState(prev => {
      const newPlaylist = prev.playlist.filter(b => b.id !== bookId)
      let newIndex = prev.currentPlaylistIndex
      
      // 如果移除的是当前播放的书籍
      if (prev.currentBook?.id === bookId) {
        newIndex = -1
      } else if (prev.currentPlaylistIndex > -1) {
        // 调整索引
        const removedIndex = prev.playlist.findIndex(b => b.id === bookId)
        if (removedIndex < prev.currentPlaylistIndex) {
          newIndex = prev.currentPlaylistIndex - 1
        }
      }
      
      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nookix_playlist', JSON.stringify({
            playlist: newPlaylist,
            currentPlaylistIndex: newIndex
          }))
        } catch (e) {
          console.error('Failed to save playlist to localStorage:', e)
        }
      }
      
      return {
        ...prev,
        playlist: newPlaylist,
        currentPlaylistIndex: newIndex
      }
    })
  }

  // 播放列表中的指定书籍
  const playFromPlaylist = (index: number) => {
    if (index < 0 || index >= state.playlist.length) return
    
    const book = state.playlist[index]
    setState(prev => {
      const newIndex = index
      
      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nookix_playlist', JSON.stringify({
            playlist: prev.playlist,
            currentPlaylistIndex: newIndex
          }))
        } catch (e) {
          console.error('Failed to save playlist to localStorage:', e)
        }
      }
      
      return {
        ...prev,
        currentPlaylistIndex: newIndex
      }
    })
    playBook(book)
  }

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (!audioRef.current) return
      
      const currentTime = audioRef.current.currentTime
      const currentBook = state.currentBook
      
      // 检查播放限制
      // 优先使用显式设置的 playbackLimit，否则使用默认逻辑
      let effectiveLimit: number | null = null
      
      if (state.playbackLimit !== null && state.playbackLimit !== undefined) {
        // 使用显式设置的播放限制
        effectiveLimit = state.playbackLimit
        console.log('[播放限制] 使用显式设置的限制:', effectiveLimit, '秒')
      } else if (currentBook?.isPremium && !isUserPremiumRef.current) {
        // 默认逻辑：Premium 书籍 && 非会员用户 -> 计算播放限制
        let playbackLimit = 300 // 默认 5 分钟
        
        // 尝试从 book_transcript 解析第二个 section 的开始时间
        if (currentBook.book_transcript) {
          try {
            const transcript = typeof currentBook.book_transcript === 'string' 
              ? JSON.parse(currentBook.book_transcript) 
              : currentBook.book_transcript
            
            // 检查是否有 sections 结构
            if (transcript?.sections && Array.isArray(transcript.sections) && transcript.sections.length > 1) {
              // 找到第二个 section 的第一个句子的时间戳
              const secondSection = transcript.sections[1]
              if (secondSection?.paragraphs?.[0]?.sentences?.[0]?.startTime) {
                playbackLimit = secondSection.paragraphs[0].sentences[0].startTime
                console.log('[播放限制] ✅ 从 book_transcript 读取到播放限制:', playbackLimit, '秒 (第二个 section 的开始时间)')
              } else {
                console.log('[播放限制] ⚠️ 第二个 section 没有 startTime，使用默认值 300 秒')
              }
            } else {
              console.log('[播放限制] ⚠️ book_transcript 没有足够的 sections，使用默认值 300 秒')
            }
          } catch (e) {
            console.warn('[播放限制] ❌ 解析 book_transcript 失败，使用默认限制 300 秒', e)
          }
        } else {
          console.log('[播放限制] ⚠️ 没有 book_transcript，使用默认值 300 秒')
        }
        
        effectiveLimit = playbackLimit
        console.log('[播放限制] 最终播放限制:', effectiveLimit, '秒')
      }
      
      // 应用播放限制
      if (effectiveLimit !== null && effectiveLimit > 0) {
        const fadeStart = effectiveLimit - 5 // 提前 5 秒开始淡出

        if (currentTime >= effectiveLimit) {
          console.log('[播放限制] ⏰ 达到播放限制，暂停播放')
          audioRef.current.pause()
          audioRef.current.volume = 1.0 // 重置音量
          
          // 调用自定义回调（如果有）
          if (state.onLimitReachedCallback) {
            console.log('[播放限制] 调用自定义回调')
            state.onLimitReachedCallback()
          } else {
            // 默认行为：显示对话框
            if (!isUserLoggedInRef.current) {
              console.log('[播放限制] 显示登录对话框')
              setState(prev => ({ ...prev, showLoginDialog: true }))
            } else {
              console.log('[播放限制] 显示 Premium 升级对话框')
              showPremiumConfirmation()
            }
          }
          return
        } else if (currentTime >= fadeStart) {
          // 实现平滑淡出
          const volume = Math.max(0, 1 - (currentTime - fadeStart) / (effectiveLimit - fadeStart))
          audioRef.current.volume = volume
          console.log('[播放限制] 🔉 淡出中，音量:', volume.toFixed(2), '剩余:', (effectiveLimit - currentTime).toFixed(0), 's')
        } else {
          // 正常播放时确保音量为 1.0
          if (audioRef.current.volume !== 1.0) {
            audioRef.current.volume = 1.0
          }
        }
      } else {
        // 无限制，确保音量为 1.0
        if (audioRef.current.volume !== 1.0) {
          audioRef.current.volume = 1.0
        }
      }

      setState(prev => ({
        ...prev,
        currentTime: audioRef.current!.currentTime,
      }))
      
      // 每隔10秒自动保存一次播放记录
      const now = Date.now()
      if (now - lastRecordRef.current > 10000) {
        setState(prev => {
          if (prev.currentBook && prev.currentTrack && audioRef.current) {
            updatePlaybackRecord(prev.currentBook, prev.currentTrack, audioRef.current.currentTime, audioRef.current.duration)
          }
          return prev
        })
        lastRecordRef.current = now
      }
    }

    const handleLoadedMetadata = () => {
      if (!audioRef.current) return
      // 新增详细日志
      console.log('[播放器] handleLoadedMetadata 触发，duration:', audioRef.current.duration)
      setState(prev => ({
        ...prev,
        duration: audioRef.current!.duration,
      }))
    }

    const handleEnded = () => {
      console.log('[音频播放] 音频播放结束')
      
      // ✅ 修复：使用 setState 的函数式更新获取最新的 state
      setState(prev => {
        if (prev.currentBook && prev.currentTrack && audioRef.current) {
          updatePlaybackRecord(prev.currentBook, prev.currentTrack, audioRef.current.currentTime, audioRef.current.duration)
        }
        
        // 检查是否有 onLimitReachedCallback（用于预览音频结束）
        if (prev.onLimitReachedCallback) {
          console.log('[音频播放] 调用 onLimitReachedCallback')
          prev.onLimitReachedCallback()
          return prev
        }
        
        return prev
      })
      
      // 如果没有回调，则播放下一个音轨
      if (!state.onLimitReachedCallback) {
        nextTrack()
      }
    }

    const handlePlay = () => {
      setState(prev => ({
        ...prev,
        isPlaying: true,
      }))
    }

    const handlePause = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
      }))
      // ✅ 修复：使用 setState 的函数式更新获取最新的 state
      setState(prev => {
        if (prev.currentBook && prev.currentTrack && audioRef.current) {
          updatePlaybackRecord(prev.currentBook, prev.currentTrack, audioRef.current.currentTime, audioRef.current.duration)
        }
        return prev
      })
    }

    const handleError = (e: Event) => {
      const audio = e.currentTarget as HTMLAudioElement
      const mediaError = audio.error
      const errorSnapshot = {
        code: mediaError?.code ?? null,
        message: mediaError?.message || null,
        networkState: audio.networkState,
        readyState: audio.readyState,
        currentSrc: audio.currentSrc || null,
        src: audio.getAttribute('src') || null,
      }
      const audioSrc = errorSnapshot.currentSrc || errorSnapshot.src || ''
      
      // 如果 src 为空或者是当前页面 URL（表示被清空了），忽略错误
      // 这通常发生在用户登出或手动清理音频时
      if (!audioSrc || audioSrc === window.location.href || !audio.hasAttribute('src')) {
        console.log('[音频播放器] 音频源已清空，忽略错误事件')
        return
      }
      
      console.error('音频播放错误详情:', errorSnapshot)
      
      let toastMsg = 'Audio playback failed'
      if (mediaError?.code === 1) toastMsg = 'Playback aborted'
      if (mediaError?.code === 2) toastMsg = 'Network error'
      if (mediaError?.code === 3) toastMsg = 'Decode failed'
      if (mediaError?.code === 4) toastMsg = 'Format not supported or file not found'

      showToast(`${toastMsg} (${mediaError?.code || 'ERR'})`)
      
      setState(prev => ({
        ...prev,
        isPlaying: false,
      }))
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [state.currentBook, state.currentTrack]) // 依赖项只包含 currentBook 和 currentTrack

  // 登录状态已在上面的 useEffect 中通过 supabase.auth.onAuthStateChange 处理
  // 不需要额外的 PocketBase 监听器

  // 组件卸载时清理过期缓存
  useEffect(() => {
    return () => {
      console.log('[Audio Player] 组件卸载，清理过期缓存')
      cleanupExpiredCache()
    }
  }, [])

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
        playBook,
        playTrack: playTrack,
        togglePlay,
        seekTo,
        nextTrack: nextTrack,
        previousTrack: previousTrack,
        playNextBookInPlaylist,
        playPreviousBookInPlaylist,
        updatePlaybackRecord,
        hidePlayer,
        showPlayer,
        restoreLastPlayedBook,
        stopAndResetPlayer,
        setUserPremium,
        closePremiumDialog,
        showPremiumUpgrade: showPremiumConfirmation,
        openLoginDialog: () => {
          setState(prev => ({ ...prev, showLoginDialog: true }))
        },
        closeLoginDialog: () => {
          setState(prev => ({
            ...prev,
            showLoginDialog: false
          }))
        },
        openSignupDialog: () => {
          setState(prev => ({ ...prev, showSignupDialog: true }))
        },
        closeSignupDialog: () => {
          setState(prev => ({
            ...prev,
            showSignupDialog: false
          }))
        },
        setUserLoggedIn,
        isUserLoggedIn: state.isUserLoggedIn,
        showToast,
        hideToast: () => {
          setState(prev => ({
            ...prev,
            toastMessage: null,
          }))
        },
        setAudioRef: (ref: HTMLAudioElement | null) => {
          audioRef.current = ref
        },
        setPlaybackSpeed: (speed: number) => {
          if (audioRef.current) {
            audioRef.current.playbackRate = speed
          }
        },
        addToPlaylist,
        clearPlaylist,
        removeFromPlaylist,
        playFromPlaylist,
        setPlaybackLimit: (limit: number | null) => {
          setState(prev => ({ ...prev, playbackLimit: limit }))
        },
        setAudioSource: (source: 'preview' | 'full') => {
          setState(prev => ({ ...prev, audioSource: source }))
        },
        setOnLimitReachedCallback: (callback: (() => void) | null) => {
          setState(prev => ({ ...prev, onLimitReachedCallback: callback }))
        },
      }}
    >
      {children}
      <audio 
        ref={audioRef} 
        style={{ display: "none" }} 
        preload="metadata" 
      />
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
  }
  return context
}
 