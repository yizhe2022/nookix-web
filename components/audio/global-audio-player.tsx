"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Crown,
  Plus,
  Minus,
  Share2,
  RefreshCw,
  ListMusic
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PremiumConfirmationDialog from "@/components/ui/premium-confirmation-dialog"
import LoginDialog from "@/components/auth/login-dialog"
import SignupDialog from "@/components/auth/signup-dialog"
import SimpleToast from "@/components/ui/simple-toast"
import { isBookInLibrary, toggleBookInLibrary } from "@/lib/library-service"
import { useIsMobile } from "@/hooks/use-mobile"
import PlaylistSheet from "@/components/audio/playlist-sheet"
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function GlobalAudioPlayer() {
  // ... existing hooks
  // ...
  const {
    // ... existing context props
    currentBook,
    currentTrack: currentChapter,
    isPlaying,
    currentTime,
    duration,
    isPlayerVisible,
    showPremiumDialog,
    toastMessage,
    isUserLoggedIn,
    togglePlay,
    seekTo,
    playNextBookInPlaylist,
    playPreviousBookInPlaylist,
    hidePlayer,
    closePremiumDialog,
    showPremiumUpgrade,
    showLoginDialog,
    openLoginDialog,
    closeLoginDialog,
    showSignupDialog,
    openSignupDialog,
    closeSignupDialog,
    showToast,
    hideToast,
    setAudioRef,
    setPlaybackSpeed,
    playbackLimit,
    onLimitReachedCallback,
  } = useAudioPlayer()

  const isMobile = useIsMobile()
  const [playbackSpeed, setPlaybackSpeedState] = useState(1)
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false) // New State
  const router = useRouter()

  // ... checkLibraryStatus, handleLibraryToggle, useEffects ...

  // 检查书架状态
  const checkLibraryStatus = async () => {
    if (!isUserLoggedIn || !currentBook?.id) return

    try {
      const inLibrary = await isBookInLibrary(currentBook.id)
      setIsInLibrary(inLibrary)
    } catch (error) {
      console.error('检查书架状态失败:', error)
    }
  }

  // 处理加入/移除书架
  const handleLibraryToggle = async () => {
    if (!currentBook?.id) return

    // 未登录时，设置重定向到当前书本详情页，然后跳转到登录页
    if (!isUserLoggedIn) {
      const bookSlug = currentBook.slug
      const currentUrl = `/book/${bookSlug}`
      localStorage.setItem('redirectAfterLogin', currentUrl)
      router.push('/auth/signin?redirect=book')
      return
    }

    setLibraryLoading(true)
    try {
      const result = await toggleBookInLibrary(currentBook.id)
      if (result.success) {
        setIsInLibrary(result.isInLibrary)
        console.log(result.message)
      } else {
        console.error(result.message)
      }
    } catch (error) {
      console.error('书架操作失败:', error)
    } finally {
      setLibraryLoading(false)
    }
  }

  // 当用户登录状态或当前书本变化时，检查书架状态
  useEffect(() => {
    checkLibraryStatus()
  }, [currentBook?.id, isUserLoggedIn])

  // 切换播放速度
  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]
    setPlaybackSpeedState(newSpeed)
    setPlaybackSpeed(newSpeed)
  }

  // 处理进度条点击 - 优化避免强制重排
  const progressBarRef = useRef<HTMLDivElement>(null)
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const clickX = e.nativeEvent.offsetX
    const width = target.clientWidth
    if (width === 0) return
    const percentage = Math.max(0, Math.min(1, clickX / width))
    const newTime = percentage * duration

    // 播放限制：拖动超出边界直接触发升级弹窗，不执行 seek
    if (playbackLimit !== null && playbackLimit !== undefined && newTime > playbackLimit) {
      if (onLimitReachedCallback) {
        onLimitReachedCallback()
      } else {
        showPremiumUpgrade()
      }
      return
    }

    seekTo(newTime)
  }, [duration, seekTo, playbackLimit, onLimitReachedCallback, showPremiumUpgrade])

  if (!currentBook || !currentChapter || !isPlayerVisible) {
    return (
      <>
        <PremiumConfirmationDialog isOpen={showPremiumDialog} onClose={closePremiumDialog} />
        <SimpleToast message={toastMessage} onClose={hideToast} />
        <LoginDialog 
          isOpen={showLoginDialog} 
          onClose={closeLoginDialog} 
          onSuccess={closeLoginDialog}
          onSwitchToSignup={() => {
            closeLoginDialog()
            openSignupDialog()
          }}
        />
        <SignupDialog 
          isOpen={showSignupDialog} 
          onClose={closeSignupDialog} 
          onSuccess={closeSignupDialog}
          onSwitchToLogin={() => {
            closeSignupDialog()
            openLoginDialog()
          }}
        />
      </>
    )
  }

  return (
    <>
      <PremiumConfirmationDialog isOpen={showPremiumDialog} onClose={closePremiumDialog} />
      <LoginDialog 
        isOpen={showLoginDialog} 
        onClose={closeLoginDialog} 
        onSuccess={closeLoginDialog}
        onSwitchToSignup={() => {
          closeLoginDialog()
          openSignupDialog()
        }}
      />
      <SignupDialog 
        isOpen={showSignupDialog} 
        onClose={closeSignupDialog} 
        onSuccess={closeSignupDialog}
        onSwitchToLogin={() => {
          closeSignupDialog()
          openLoginDialog()
        }}
      />
      <SimpleToast message={toastMessage} onClose={hideToast} />

      {/* Playlist Sheet */}
      <PlaylistSheet isOpen={isPlaylistOpen} onOpenChange={setIsPlaylistOpen} />

      {/* 全局播放条 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#151515] shadow-lg z-50 pb-[env(safe-area-inset-bottom)]" style={{ backgroundColor: '#151515' }}>

        {/* 关闭按钮 - Absolute Top Right */}
        <div className="absolute top-2 right-2 z-20">
          <Button
            size="sm"
            variant="ghost"
            onClick={hidePlayer}
            className="h-6 w-6 rounded-full p-0 text-gray-500 hover:text-white hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 移动端: 顶部进度条 (全宽) */}
        <div className="block md:hidden w-full h-1 bg-gray-700 cursor-pointer absolute top-0 left-0" onClick={handleProgressClick}>
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* 主要内容区域 - 1300px宽度居中 */}
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:gap-4 py-3 md:pr-12">

            {/* 书本封面 - 移动端缩小 */}
            <Link href={`/book/${currentBook.slug}`} className="flex-shrink-0 group">
              <div className="relative w-10 h-14 md:w-12 md:h-16 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src={currentBook.cover || "/placeholder.svg"}
                  alt={currentBook.title}
                  fill
                  sizes="(max-width: 768px) 40px, 48px"
                  className="object-cover rounded-md md:rounded-lg transition-opacity duration-200 group-hover:opacity-90"
                />
              </div>
            </Link>

            {/* 书本信息 */}
            <div className="flex-1 min-w-0 max-w-[40%] md:max-w-xs cursor-pointer" onClick={() => router.push(`/book/${currentBook.slug}`)}>
              <div className="flex items-center">
                <h4 className="font-medium text-white text-sm line-clamp-1 transition-colors duration-200 hover:text-blue-400">
                  {currentBook.title}
                </h4>
                {currentBook.isPremium && (
                  <Crown className="w-3 h-3 text-[#EBB30B] fill-current ml-1 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-400 line-clamp-1 transition-colors duration-200 hover:text-gray-300">
                {currentBook.author}
              </p>
            </div>

            {/* 右侧控制区域 */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
              {/* 播放控制按钮 */}
              <div className="flex items-center gap-3 md:gap-2 flex-shrink-0">
                {/* Playlist Toggle Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!isUserLoggedIn) {
                      openLoginDialog()
                    } else {
                      setIsPlaylistOpen(true)
                    }
                  }}
                  className="h-8 w-8 rounded-full p-0 text-white hover:text-white hover:bg-gray-700"
                  title="Playlist"
                >
                  <ListMusic className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={playPreviousBookInPlaylist} className="hidden md:flex h-8 w-8 rounded-full p-0 text-white hover:text-white hover:bg-gray-700">
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={togglePlay} className="h-10 w-10 md:h-10 md:w-10 rounded-full p-0 text-white hover:text-white hover:bg-gray-700 bg-gray-800">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </Button>

                <Button variant="ghost" size="sm" onClick={playNextBookInPlaylist} className="h-8 w-8 rounded-full p-0 text-white hover:text-white hover:bg-gray-700">
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={toggleSpeed} className="hidden md:flex h-8 px-2 text-white hover:text-white hover:bg-gray-700 text-xs">
                  {playbackSpeed}x
                </Button>
              </div>

              {/* 进度条区域 - 桌面端显示 */}
              <div className="hidden md:block w-[250px] flex-shrink-0 relative group">
                {/* 时间显示 */}
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* 进度条 */}
                <div className="w-full h-1 bg-gray-600 rounded-full cursor-pointer flex items-center" onClick={handleProgressClick}>
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-100" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
                </div>
                {/* Playlist Button - Absolute positioned relative to container or flex item? Requested "Right side of progress bar" */}
              </div>



            </div>
          </div>
        </div>
      </div>
    </>
  )
} 