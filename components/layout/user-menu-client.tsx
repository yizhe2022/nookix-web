"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Menu, X, BookOpen, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/utils/supabase/client"

interface Genre {
    id: string
    name: string
}

interface CategoryGroup {
    category: string
    genres: Genre[]
}

interface UserMenuClientProps {
    initialCategories?: CategoryGroup[]
    isMobile?: boolean
}

export default function UserMenuClient({ initialCategories = [], isMobile = false }: UserMenuClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { user, userProfile } = useAuth()
    const [avatarError, setAvatarError] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
    const [categories] = useState(initialCategories)
    const [activeMenu, setActiveMenu] = useState("")

    // 调试日志
    console.log('[UserMenuClient] 渲染，user:', user?.email, 'userProfile:', userProfile?.display_name)

    useEffect(() => {
        setAvatarError(false)
    }, [user])

    useEffect(() => {
        if (pathname === "/") setActiveMenu("Home")
        else if (pathname.startsWith("/app")) setActiveMenu("Get APP")
        else if (pathname.startsWith("/collections")) setActiveMenu("Collections")
        else if (pathname.startsWith("/library")) setActiveMenu("Library")
        else setActiveMenu("")
    }, [pathname])

    const handleLoginClick = () => router.push("/auth/signin")
    const handleSignUpClick = () => router.push("/auth/signup")
    
    const signOut = async () => {
        console.log('[UserMenuClient] 用户登出')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    const getAvatarUrl = () => {
        // 返回 userProfile 的头像 URL（如果存在）
        return userProfile?.avatar_url
    }
    
    const shouldShowAvatar = () => {
        // 只有当 user 存在且 userProfile 已加载完成时才显示头像
        // 这样可以避免先显示默认头像再切换到自定义头像的闪烁问题
        return user && userProfile !== undefined
    }

    const getUserDisplayName = () => {
        if (userProfile?.display_name) return userProfile.display_name
        if (user?.email) return user.email.split('@')[0]
        return "User"
    }

    const getUserInitial = () => {
        const displayName = getUserDisplayName()
        return displayName.charAt(0).toUpperCase()
    }

    // 移动端视图
    if (isMobile) {
        return (
            <>
                {user ? (
                    <Link href="/dashboard/profile">
                        <Button variant="ghost" size="sm" className="p-1">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                {shouldShowAvatar() && getAvatarUrl() && !avatarError ? (
                                    <Image
                                        src={getAvatarUrl()!}
                                        alt="User avatar"
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                        unoptimized
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">{getUserInitial()}</span>
                                    </div>
                                )}
                            </div>
                        </Button>
                    </Link>
                ) : null}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {isMenuOpen && (
                    <div className="fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
                        <div className="px-4 py-6 space-y-4">
                            <nav className="space-y-2">
                                {[
                                    { name: 'Home', path: '/' },
                                    { name: 'Collections', path: '/collections' },
                                    { name: 'Get APP', path: '/app' }
                                ].map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={`block px-3 py-2 text-sm font-medium rounded-md ${
                                            activeMenu === item.name ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}

                                <div className="py-1">
                                    <button
                                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600"
                                    >
                                        <span>Categories</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isCategoriesOpen && (
                                        <div className="pl-4 mt-1 bg-gray-50 rounded-md py-2">
                                            {categories.map((group) => (
                                                <div key={group.category} className="space-y-1">
                                                    <div className="px-3 py-1 text-xs font-semibold text-gray-400">{group.category}</div>
                                                    {group.genres.map((genre) => (
                                                        <Link
                                                            key={genre.id}
                                                            href={`/genres/${encodeURIComponent(genre.name.toLowerCase().replace(/\s+/g, '-'))}`}
                                                            className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600"
                                                            onClick={() => setIsMenuOpen(false)}
                                                        >
                                                            {genre.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </nav>

                            {!user && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Button variant="ghost" className="w-full" onClick={() => { handleLoginClick(); setIsMenuOpen(false); }}>
                                        Sign in
                                    </Button>
                    <Button className="w-full" onClick={() => { handleSignUpClick(); setIsMenuOpen(false); }}>
                                        Get Started
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        )
    }

    // 桌面端视图
    return user ? (
        <>
            <Link href="/dashboard/library">
                <Button variant="ghost" size="sm" className={`text-sm font-medium ${activeMenu === "Library" ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`}>
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Library
                </Button>
            </Link>
            <Link href="/dashboard/profile">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-0 rounded-full focus:outline-none transition-colors">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        {shouldShowAvatar() && getAvatarUrl() && !avatarError ? (
                            <Image
                                src={getAvatarUrl()!}
                                alt={getUserDisplayName()}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">{getUserInitial()}</span>
                            </div>
                        )}
                    </div>
                </button>
            </Link>
        </>
    ) : (
        <>
            <Button variant="ghost" size="sm" className="text-sm font-medium text-gray-600 hover:text-blue-600" onClick={handleLoginClick}>
                Sign in
            </Button>
            <Button size="sm" className="text-sm font-medium" onClick={handleSignUpClick}>
                Get Started
            </Button>
        </>
    )
}
