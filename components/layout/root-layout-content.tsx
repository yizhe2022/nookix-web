"use client"

import { usePathname } from 'next/navigation'
import HeaderServer from '@/components/layout/header-server'
import Footer from '@/components/layout/footer'
import MainWrapper from '@/components/layout/main-wrapper'
import PerformanceMonitor from '@/components/ui/performance-monitor'

export default function RootLayoutContent({ 
    children,
    initialCategories = []
}: { 
    children: React.ReactNode,
    initialCategories?: any[]
}) {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard') || pathname === '/redeem'
    const isImmersiveAuth = pathname === '/auth/signin' || pathname === '/auth/signup'
    
    // Dashboard、受限后台和独立认证页使用各自的页面外壳
    if (isDashboard || isImmersiveAuth) {
        return <>{children}</>
    }
    
    // 其余官网路由显示 Header 和 Footer
    return (
        <>
            {/* 服务端渲染的 Header */}
            <HeaderServer initialCategories={initialCategories} />
            
            {/* 主内容区域 */}
            <MainWrapper>{children}</MainWrapper>
            
            {/* 服务端渲染的 Footer */}
            <Footer />
            
            {/* 延迟加载的客户端组件 */}
            <PerformanceMonitor />
        </>
    )
}
