"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Menu, X, BookOpen } from "lucide-react"
import CategoriesMenu from "./categories-menu"
import Image from "next/image"
import { getSlugForGenre } from "@/lib/genre-slugs"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/contexts/auth-context"

interface HeaderProps {
    initialCategories?: any[]
}

export default function Header({ initialCategories = [] }: HeaderProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
    const [activeMenu, setActiveMenu] = useState("")
    const [categories, setCategories] = useState<Array<{ category: string, genres: Array<{ id: string, name: string }> }>>(initialCategories)
    const [avatarError, setAvatarError] = useState(false)

    // 使用全局 AuthContext
    const { user, userProfile, isLoading } = useAuth()

    // 立即执行的调试日志
    console.log('[Header] 组件渲染，Auth state:', { 
        user: user?.email, 
        userProfile: userProfile?.display_name,
        avatar: userProfile?.avatar_url,
        isLoading 
    })

    // 调试日志
    useEffect(() => {
        console.log('[Header] useEffect 触发，Auth state:', { 
            user: user?.email, 
            userProfile: userProfile?.display_name,
            avatar: userProfile?.avatar_url,
            isLoading 
        })
    }, [user, userProfile, isLoading])

    // 当用户变化时，重置头像错误状态
    useEffect(() => {
        setAvatarError(false);
    }, [user]);

    useEffect(() => {
        if (pathname === "/") setActiveMenu("Home");
        else if (pathname.startsWith("/collections")) setActiveMenu("Collections");
        else if (pathname.startsWith("/blog")) setActiveMenu("Blog");
        else if (pathname.startsWith("/app")) setActiveMenu("Get APP");
        else if (pathname.startsWith("/library")) setActiveMenu("Library");
        else if (pathname.startsWith("/explore")) setActiveMenu("Explore");
        else setActiveMenu("");
        
        console.log('Current pathname:', pathname, 'Active menu:', pathname.startsWith("/collections") ? "Collections" : "Other");
    }, [pathname]);

    // --- 核心优化点 3：分类数据已从服务端传入，客户端只需订阅同步 ---
    useEffect(() => {
        if (initialCategories.length > 0) {
            setCategories(initialCategories);
        }
    }, [initialCategories]);

    const handleSearchClick = () => router.push("/explore?focus=search");
    
    const handleLoginClick = () => {
        // 从 Header 登录，默认跳转到 For You（不设置重定向）
        router.push("/auth/signin");
    };
    
    const handleSignUpClick = () => {
        router.push("/auth/signup");
    };
    const signOut = async () => {
        console.log('[Header] 用户登出，清除认证状态')
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    };

    const getAvatarUrl = () => {
        return userProfile?.avatar_url || ""
    };

    const getUserDisplayName = () => {
        if (userProfile?.display_name) return userProfile.display_name
        if (user?.email) return user.email.split('@')[0]
        return "User"
    };

    const getUserInitial = () => {
        const displayName = getUserDisplayName();
        return displayName.charAt(0).toUpperCase();
    };

    return (
        <header className="bg-white sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1300px] px-4 sm:px-6 lg:px-8 mx-auto">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="relative w-8 h-8 md:w-[42px] md:h-[42px]">
                            <Image src="/nookix-logo.webp?v=5" alt="Nookix" fill className="object-contain" priority sizes="(max-width: 768px) 32px, 42px" />
                        </div>
                        <span className="text-[1.49rem] md:text-[1.8rem] font-extrabold text-gray-900 font-[family-name:var(--font-nunito)]">Nookix</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center space-x-8">
                            {['Home'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}
                                    className={`text-sm font-normal transition-colors ${activeMenu === item ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {item}
                                </Link>
                            ))}

                            <CategoriesMenu />

                            {['Collections'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}
                                    className={`text-sm font-normal transition-colors ${activeMenu === item ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {item}
                                </Link>
                            ))}

                            {['Get APP'].map((item) => (
                                <Link
                                    key={item}
                                    href="/app"
                                    className={`text-sm font-normal transition-colors ${activeMenu === item ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {item}
                                </Link>
                            ))}

                            {['Get APP'].map((item) => (
                                <Link
                                    key={item}
                                    href="/app"
                                    className={`text-sm font-normal transition-colors ${activeMenu === item ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
                                        }`}
                                >
                                    {item}
                                </Link>
                            ))}
                        </nav>

                        <Button variant="ghost" size="sm" className={`${activeMenu === "Explore" ? "text-blue-600" : "text-gray-600 hover:text-blue-600"}`} onClick={handleSearchClick}>
                            <Search className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center space-x-3">
                            {user ? (
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
                                                {getAvatarUrl() && !avatarError ? (
                                                    <Image
                                                        src={getAvatarUrl()}
                                                        alt={getUserDisplayName()}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                        onError={() => setAvatarError(true)}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">
                                                            {getUserInitial()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Button variant="ghost" size="sm" className="text-sm font-medium text-gray-600 hover:text-blue-600" onClick={handleLoginClick}>Sign in</Button>
                                    <Button size="sm" className="text-sm font-medium" onClick={handleSignUpClick}>Get Started</Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <div className="md:hidden flex items-center gap-1">
                        {/* 移动端搜索按钮 - 新增 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600"
                            onClick={handleSearchClick}
                        >
                            <Search className="h-5 w-5" />
                        </Button>

                        {/* 移动端用户头像 - 仅当用户已登录时显示 */}
                        {user && (
                            <Link href="/dashboard/profile">
                                <Button variant="ghost" size="sm" className="p-1">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                        {getAvatarUrl() && !avatarError ? (
                                            <Image
                                                src={getAvatarUrl()}
                                                alt="User avatar"
                                                fill
                                                sizes="32px"
                                                className="object-cover"
                                                unoptimized
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white text-sm font-bold">
                                                    {getUserInitial()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Button>
                            </Link>
                        )}

                        {/* 移动端菜单按钮 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                            className="flex items-center gap-2"
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 h-[calc(100vh-64px)] overflow-y-auto">
                        <div className="px-4 py-6 space-y-4">
                            <nav className="space-y-2">
                                {['Home'].map((item) => (
                                    <Link
                                        key={item}
                                        href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}
                                        className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeMenu === item ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item}
                                    </Link>
                                ))}

                                {['Collections'].map((item) => (
                                    <Link
                                        key={item}
                                        href={`/${item.toLowerCase() === 'home' ? '' : item.toLowerCase()}`}
                                        className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeMenu === item ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item}
                                    </Link>
                                ))}

                                {['Get APP'].map((item) => (
                                    <Link
                                        key={item}
                                        href="/app"
                                        className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeMenu === item ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item}
                                    </Link>
                                ))}

                                {/* Categories Section - Mobile Only - Default Collapsed */}
                                <div className="py-1">
                                    <button
                                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                                    >
                                        <span>Categories</span>
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isCategoriesOpen && (
                                        <div className="space-y-1 pl-4 mt-1 bg-gray-50/50 rounded-md py-2">
                                            {categories.map((group) => (
                                                <div key={group.category} className="space-y-1">
                                                    <div className="px-3 py-1 text-xs font-semibold text-gray-400">
                                                        {group.category}
                                                    </div>
                                                    {group.genres.map((genre) => (
                                                        <Link
                                                            key={genre.id}
                                                            href={`/genres/${getSlugForGenre(genre.name)}`}
                                                            className="block px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 rounded-md pl-6"
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

                                {['App'].map((item) => (
                                    <Link
                                        key={item}
                                        href={`/${item.toLowerCase()}`}
                                        className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeMenu === item ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item}
                                    </Link>
                                ))}

                            </nav>

                            {/* 未登录用户的登录选项 */}
                            {!user && (
                                <div className="space-y-2 pt-4 border-t border-gray-100">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-sm font-medium text-gray-600 hover:text-blue-600"
                                        onClick={() => {
                                            handleLoginClick();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Sign in
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-full justify-start text-sm font-medium"
                                        onClick={() => {
                                            handleSignUpClick();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        Get Started
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}