// 用户菜单骨架屏 - 用于服务端渲染时显示
export default function UserMenuSkeleton() {
    return (
        <div className="flex items-center space-x-3">
            {/* Library 按钮骨架 */}
            <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
            
            {/* 用户头像骨架 */}
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
    )
}
