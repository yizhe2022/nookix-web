"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useReader } from "@/contexts/reader-context"
import { Button } from "@/components/ui/button"
import {
  Play,
  Pause,
  ListMusic
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import PremiumConfirmationDialog from "@/components/ui/premium-confirmation-dialog"
import LoginDialog from "@/components/auth/login-dialog"
import SignupDialog from "@/components/auth/signup-dialog"
import SimpleToast from "@/components/ui/simple-toast"
import PlaylistSheet from "@/components/audio/playlist-sheet"

const FALLBACK_DISPLAY_DURATION = 60 * 60

function formatTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const mins = Math.floor(safeSeconds / 60)
  const secs = Math.floor(safeSeconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// 快进/快退图标组件（移植自移动端）
function Forward30Icon({ className }: { className?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none" className={className}>
      <path d="M522.24 102.4c128-0.128 248.96 58.24 328.576 158.464l2.304 2.944 56.384-44.16a8.064 8.064 0 0 1 12.992 6.016v0.256l-0.768 180.864a8.064 8.064 0 0 1-9.728 7.808l-0.192-0.064-175.616-43.008a8 8 0 0 1-3.2-13.952l0.192-0.192 60.16-46.976a344.704 344.704 0 0 0-27.776-31.36 341.504 341.504 0 0 0-243.072-100.864A341.76 341.76 0 0 0 279.424 279.04a342.208 342.208 0 0 0-100.736 243.328 342.208 342.208 0 0 0 99.712 242.176l1.024 1.024a341.504 341.504 0 0 0 243.072 100.864 341.76 341.76 0 0 0 243.072-100.864 341.952 341.952 0 0 0 73.152-108.032l0.64-1.344a308.48 308.48 0 0 0 5.824-14.848 8 8 0 0 1 9.856-4.928l0.256 0.128 56.704 19.456c4.224 1.408 6.4 6.144 4.864 10.304A419.84 419.84 0 0 1 102.4 521.92 419.712 419.712 0 0 1 522.24 102.4zM398.464 368.384c53.504 0 92.16 35.712 92.16 86.656 0 32.64-14.848 51.392-34.816 61.952 21.632 11.52 39.04 32.256 39.04 68.864 0 60.288-44.16 89.984-96 89.984-48.704 0-94.592-25.344-96.32-87.296v-1.856h55.168c0.832 27.136 19.52 39.488 41.152 39.488 23.808 0 40.768-14.848 40.768-42.048 0-24.832-14.976-41.28-41.6-41.6h-8.96v-48h8.128c26.688 0 38.208-16.576 38.208-37.76 0-25.536-16.96-38.656-36.928-38.656-20.672 0-35.84 13.312-37.376 35.84v0.64h-55.232c1.28-53.888 41.6-86.208 92.608-86.208z m232.32 0c48.704 0 90.88 31.616 91.648 88.32v129.152c0 57.728-42.432 89.984-91.712 89.984-48.768 0-91.264-31.616-92.16-88.32V458.496c0-57.728 42.88-90.048 92.16-90.048z m0 49.664c-21.504 0-36.672 15.488-36.992 40.448v126.912c0 25.472 15.296 40.768 36.928 40.768 21.504 0 36.224-14.976 36.48-40V459.264c0-25.472-14.784-41.152-36.48-41.152v-0.064z" fill="white" />
    </svg>
  )
}

function Backward30Icon({ className }: { className?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 1024 1024" fill="none" className={className}>
      <path d="M501.76 102.4c-128-0.128-248.96 58.24-328.576 158.464l-2.304 2.944-56.384-44.16a8.064 8.064 0 0 0-12.992 6.016v0.256l0.768 180.864c0 4.992 4.8 8.832 9.728 7.808l0.192-0.064 175.616-43.008a8 8 0 0 0 3.2-13.952l-0.192-0.192-60.16-46.976c8.576-11.008 17.92-21.504 27.776-31.36a341.504 341.504 0 0 1 243.072-100.864 341.76 341.76 0 0 1 243.072 100.864 342.208 342.208 0 0 1 100.736 243.328 342.208 342.208 0 0 1-99.712 242.176l-1.024 1.024a341.504 341.504 0 0 1-243.072 100.864 341.76 341.76 0 0 1-243.072-100.864 342.144 342.144 0 0 1-73.152-108.032l-0.64-1.344a271.232 271.232 0 0 1-5.824-14.848 8 8 0 0 0-9.856-4.928l-0.256 0.128-56.704 19.456a8.064 8.064 0 0 0-4.864 10.304A419.84 419.84 0 0 0 921.6 521.92 419.712 419.712 0 0 0 501.76 102.4zM397.504 368.384c-50.944 0-91.264 32.256-92.544 86.208h55.168c1.28-22.912 16.64-36.48 37.376-36.48 19.968 0 36.992 13.12 36.992 38.656 0 21.184-11.52 37.76-38.272 37.76h-8.064v48h8.064c27.2 0 42.496 16.512 42.496 41.6 0 27.136-17.024 42.048-40.832 42.048-21.632 0-40.32-12.288-41.152-39.488h-55.232c0.832 63.232 47.104 89.152 96.384 89.152 51.84 0 96-29.696 96-89.984 0-36.48-17.408-57.344-39.04-68.864 19.904-10.56 34.752-29.248 34.752-61.952 0-50.944-38.656-86.656-92.16-86.656h0.064z m232.32 0c-49.28 0-92.16 32.256-92.16 90.048v127.36c0 57.792 42.88 90.048 92.16 90.048 49.28 0 91.712-32.256 91.712-89.984v-127.36c0-57.792-42.496-90.112-91.712-90.112z m0 49.664c21.632 0 36.48 15.744 36.48 41.216v126.144c0 25.472-14.848 40.768-36.48 40.768-21.696 0-36.928-15.36-36.928-40.768V459.264c0-25.472 15.232-41.152 36.928-41.152v-0.064z" fill="white" />
    </svg>
  )
}

export default function DashboardAudioPlayer() {
  const { isReaderOpen } = useReader()
  const {
    currentBook,
    currentTrack: currentChapter,
    isPlaying,
    currentTime,
    duration,
    showPremiumDialog,
    toastMessage,
    isUserLoggedIn,
    togglePlay,
    seekTo,
    playNextBookInPlaylist,
    playPreviousBookInPlaylist,
    closePremiumDialog,
    showLoginDialog,
    openLoginDialog,
    closeLoginDialog,
    showSignupDialog,
    openSignupDialog,
    closeSignupDialog,
    hideToast,
    setPlaybackSpeed,
  } = useAudioPlayer()

  const [playbackSpeed, setPlaybackSpeedState] = useState(1)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const router = useRouter()

  const displayDuration = duration > 0
    ? duration
    : currentBook?.audioDurationSeconds && currentBook.audioDurationSeconds > 0
      ? currentBook.audioDurationSeconds
      : FALLBACK_DISPLAY_DURATION
  const seekDuration = duration > 0 ? duration : 0

  // 快退 30 秒
  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 30)
    seekTo(newTime)
  }

  // 快进 30 秒
  const handleSkipForward = () => {
    const newTime = Math.min(seekDuration, currentTime + 30)
    seekTo(newTime)
  }

  // 切换播放速度
  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackSpeed)
    const nextIndex = (currentIndex + 1) % speeds.length
    const newSpeed = speeds[nextIndex]
    setPlaybackSpeedState(newSpeed)
    setPlaybackSpeed(newSpeed)
  }

  // 处理进度条点击
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const clickX = e.nativeEvent.offsetX
    const width = target.clientWidth
    if (width === 0 || displayDuration <= 0) return
    const percentage = Math.max(0, Math.min(1, clickX / width))
    const newTime = percentage * displayDuration
    seekTo(newTime)
  }, [displayDuration, seekTo])

  if (!currentBook || !currentChapter) {
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

      {/* Dashboard 音频播放器 - 作为布局底行参与高度计算，避免覆盖侧栏和正文 */}
      <div className="relative z-40 flex-none shadow-lg pb-[env(safe-area-inset-bottom)]" style={{ backgroundColor: '#02314B' }}>
        
        {/* 移动端: 顶部进度条 */}
        <div className="block md:hidden w-full h-1 bg-gray-700 cursor-pointer absolute top-0 left-0" onClick={handleProgressClick}>
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${displayDuration > 0 ? Math.min(100, (currentTime / displayDuration) * 100) : 0}%` }}
          />
        </div>

        {/* 主要内容区域 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:gap-4 py-3 md:pr-12">

            {/* 书本封面 */}
            <div 
              onClick={() => {
                if (currentBook?.slug) {
                  router.push(`/dashboard/book/${currentBook.slug}`)
                }
              }}
              className="flex-shrink-0 group cursor-pointer"
            >
              <div className="relative w-10 h-14 md:w-12 md:h-16 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src={currentBook.cover || "/placeholder.svg"}
                  alt={currentBook.title}
                  fill
                  sizes="(max-width: 768px) 40px, 48px"
                  className="object-cover rounded-md md:rounded-lg transition-opacity duration-200 group-hover:opacity-90"
                />
              </div>
            </div>

            {/* 书本信息 */}
            <div 
              className="flex-1 min-w-0 max-w-[40%] md:max-w-xs cursor-pointer" 
              onClick={() => {
                if (currentBook?.slug) {
                  router.push(`/dashboard/book/${currentBook.slug}`)
                }
              }}
            >
              <div className="flex items-center">
                <h4 className="font-medium text-white text-sm line-clamp-1 transition-colors duration-200 hover:text-blue-400">
                  {currentBook.title}
                </h4>
              </div>
              <p className="text-xs text-gray-400 line-clamp-1 transition-colors duration-200 hover:text-gray-300">
                {currentBook.author}
              </p>
            </div>

            {/* 右侧控制区域 */}
            <div className="flex items-center gap-3 md:gap-4 ml-auto">
              {/* 播放控制按钮 */}
              <div className="flex items-center gap-3 md:gap-2 flex-shrink-0">
                {/* Playlist 按钮 - 暂时隐藏 */}
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
                  className="hidden h-8 w-8 rounded-full p-0 text-white hover:text-white hover:bg-gray-700"
                  title="Playlist"
                >
                  <ListMusic className="w-4 h-4" />
                </Button>

                {/* 快退 30 秒 */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkipBackward} 
                  className="hidden md:flex h-9 w-9 rounded-full p-0 text-white hover:text-white hover:bg-gray-700"
                  title="Rewind 30 seconds"
                >
                  <Backward30Icon />
                </Button>

                {/* 播放/暂停 */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={togglePlay} 
                  className="h-11 w-11 md:h-11 md:w-11 rounded-full p-0 text-white hover:text-white hover:bg-gray-700 bg-gray-800"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                </Button>

                {/* 快进 30 秒 */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkipForward} 
                  className="h-9 w-9 rounded-full p-0 text-white hover:text-white hover:bg-gray-700"
                  title="Forward 30 seconds"
                >
                  <Forward30Icon />
                </Button>

                {/* 播放速度 */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSpeed} 
                  className="hidden md:flex h-8 px-2 text-white hover:text-white hover:bg-gray-700 text-xs"
                >
                  {playbackSpeed}x
                </Button>
              </div>

              {/* 进度条区域 - 桌面端显示 */}
              <div className="hidden md:block w-[250px] flex-shrink-0 relative group">
                {/* 时间显示 */}
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(displayDuration)}</span>
                </div>

                {/* 进度条 */}
                <div
                  className="w-full h-1 bg-gray-600 rounded-full cursor-pointer flex items-center"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-100"
                    style={{ width: `${displayDuration > 0 ? Math.min(100, (currentTime / displayDuration) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
