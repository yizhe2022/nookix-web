"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Home, Compass, Library, User, LogOut, Layers, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { toast } from "sonner"

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    name: "For You",
    href: "/dashboard/for-you",
    icon: Home,
  },
  {
    name: "Explore",
    href: "/dashboard/explore",
    icon: Compass,
  },
  {
    name: "Collections",
    href: "/dashboard/collections",
    icon: Layers,
  },
  {
    name: "My Library",
    href: "/dashboard/library",
    icon: Library,
  },
  {
    name: "Get App",
    href: "/dashboard/app",
    icon: Download,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

export default function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { stopAndResetPlayer } = useAudioPlayer()
  const [mounted, setMounted] = useState(false)

  // 确保只在客户端渲染后才使用 pathname
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      // 先终止媒体和签名 URL，再销毁身份，避免 Premium 音频越过会话边界。
      stopAndResetPlayer()
      await signOut()

      toast.success("Logged out successfully")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to log out")
    }
  }

  // 获取用户头像和名称
  const userAvatar = user?.user_metadata?.avatar_url
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
  const userInitials = userName.charAt(0).toUpperCase()

  return (
    <>
      {/* 侧边栏 - 深色主题 */}
      <aside
        className={`
          w-[240px] bg-[#151922] border-r border-gray-800
          fixed inset-y-0 left-0 h-dvh z-[60]
          transform transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-dvh lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo 区域 */}
          <div className="flex items-center px-6 py-5 mb-16 flex-shrink-0">
            <Link href="/dashboard/for-you" className="flex items-center space-x-2" onClick={onClose}>
              <div className="relative w-8 h-8 md:w-[42px] md:h-[42px] rounded-full overflow-hidden">
                <Image
                  src="/nookix-logo.webp?v=5"
                  alt="Nookix"
                  fill
                  className="object-cover"
                  priority
                  sizes="42px"
                />
              </div>
              <span className="text-[1.49rem] md:text-[1.8rem] font-extrabold text-white font-[family-name:var(--font-nunito)]">
                Nookix
              </span>
            </Link>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 min-h-0 px-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              // 只在客户端挂载后才判断激活状态，避免水合错误
              const isActive = mounted && (pathname === item.href || pathname.startsWith(item.href + "/"))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout 区域 - 头像在左，按钮在右 */}
          <div className="px-4 py-4 border-t border-gray-800 flex-none">
            <div className="flex items-center justify-between gap-3">
              {/* 用户头像 */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-sm">{userInitials}</span>
                )}
              </div>

              {/* Logout 按钮 */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
