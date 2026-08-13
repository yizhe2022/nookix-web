"use client"

import { useEffect, useState } from "react"
import DashboardSidebar from "./dashboard-sidebar"
import DashboardSearchBar from "./dashboard-search-bar"
import DashboardAudioPlayer from "./dashboard-audio-player"
import DashboardHamburgerMenu from "./dashboard-hamburger-menu"
import DashboardFooter from "./dashboard-footer"
import { ReaderProvider } from "@/contexts/reader-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import { getReadingHistory } from "@/lib/library-service"

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export default function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { user, accessToken, isLoading: isAuthLoading } = useAuth()
  const { currentBook, restoreLastPlayedBook } = useAudioPlayer()

  useEffect(() => {
    if (isAuthLoading || !user || !accessToken || currentBook) return

    let cancelled = false

    const restoreLastBook = async () => {
      const result = await getReadingHistory(user.id, accessToken, 1)
      const lastBook = result.success ? result.data[0] : null
      if (!lastBook || cancelled) return

      restoreLastPlayedBook(
        {
          id: lastBook.id,
          slug: lastBook.slug,
          title: lastBook.title,
          author: lastBook.author,
          cover: lastBook.cover,
          chapters: [],
          summary_audio: lastBook.summary_audio,
          audioDurationSeconds: lastBook.audioDurationSeconds,
          isPremium: lastBook.isPremium,
        },
        lastBook.currentPosition ?? 0
      )
    }

    void restoreLastBook()
    return () => {
      cancelled = true
    }
  }, [accessToken, currentBook, isAuthLoading, restoreLastPlayedBook, user])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <ReaderProvider>
      <div className="h-dvh overflow-hidden bg-[#FCFAF7]">
        {/* 移动端侧边栏 */}
        <div className="lg:hidden">
          <DashboardSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={closeSidebar}
            />
          )}
        </div>

        {/* 桌面端布局 */}
        <div className="hidden lg:flex h-full min-h-0 items-stretch">
          {/* 整列轨道覆盖页面高度；导航本体只负责视口内吸顶。 */}
          <div className="w-[240px] flex-shrink-0 self-stretch bg-[#151922]">
            <DashboardSidebar isOpen={true} onClose={() => {}} />
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 flex min-h-0 flex-col min-w-0">
            {/* 顶部搜索栏 */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
              <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-end">
                  <div className="w-[400px]">
                    <DashboardSearchBar />
                  </div>
                </div>
              </div>
            </div>

            {/* 主内容 + Footer 容器 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* 主内容 */}
              <main className="min-h-full flex flex-col">
                <div className="flex-1">
                  {children}
                </div>
                {/* Footer */}
                <DashboardFooter />
              </main>
            </div>

            {/* 底部音频播放器 */}
            <DashboardAudioPlayer />
          </div>
        </div>

        {/* 移动端布局 */}
        <div className="lg:hidden flex h-full min-h-0 flex-col">
          {/* 顶部搜索栏 */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="px-4 py-4 flex items-center gap-4">
              <DashboardHamburgerMenu onClick={toggleSidebar} />
              <div className="flex-1">
                <DashboardSearchBar />
              </div>
            </div>
          </div>

          {/* 主内容 + Footer 容器 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* 主内容 */}
            <main className="min-h-full flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              {/* Footer */}
              <DashboardFooter />
            </main>
          </div>

          {/* 底部音频播放器 */}
          <DashboardAudioPlayer />
        </div>
      </div>
    </ReaderProvider>
  )
}

