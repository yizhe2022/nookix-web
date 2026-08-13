import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import CategoriesMenuServer from "./categories-menu-server"
import NavLink from "./nav-link"
import { Suspense } from "react"
import UserMenuClient from "./user-menu-client"
import UserMenuSkeleton from "./user-menu-skeleton"

interface HeaderServerProps {
    initialCategories?: any[]
}

// 服务端渲染的 Header 组件
export default function HeaderServer({ initialCategories = [] }: HeaderServerProps) {
    return (
        <header className="bg-white sticky top-0 z-50 shadow-sm">
            <div className="max-w-[1300px] px-4 sm:px-6 lg:px-8 mx-auto">
                <div className="flex items-center justify-between h-16">
                    {/* Logo - 服务端渲染 */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="relative w-8 h-8 md:w-[42px] md:h-[42px]">
                            <Image 
                                src="/nookix-logo.webp?v=5" 
                                alt="Nookix" 
                                fill 
                                className="object-contain" 
                                priority 
                                sizes="(max-width: 768px) 32px, 42px" 
                            />
                        </div>
                        <span className="text-[1.49rem] md:text-[1.8rem] font-extrabold text-gray-900 font-[family-name:var(--font-nunito)]">Nookix</span>
                    </Link>

                    {/* Desktop Navigation - 服务端渲染 */}
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center space-x-8">
                            <NavLink href="/">
                                Home
                            </NavLink>

                            <CategoriesMenuServer initialCategories={initialCategories} />

                            <NavLink href="/collections">
                                Collections
                            </NavLink>

                            <NavLink href="/app">
                                Get APP
                            </NavLink>
                        </nav>

                        {/* User Menu - 客户端组件，使用 Suspense */}
                        <div className="flex items-center space-x-3">
                            <Suspense fallback={<UserMenuSkeleton />}>
                                <UserMenuClient initialCategories={initialCategories} />
                            </Suspense>
                        </div>
                    </div>

                    {/* Mobile Menu - 移动端移除搜索按钮 */}
                    <div className="md:hidden flex items-center gap-1">
                        {/* 移动端用户菜单 - 延迟加载 */}
                        <Suspense fallback={<div className="w-8 h-8 bg-gray-200 rounded-full" />}>
                            <UserMenuClient initialCategories={initialCategories} isMobile />
                        </Suspense>
                    </div>
                </div>
            </div>
        </header>
    )
}
