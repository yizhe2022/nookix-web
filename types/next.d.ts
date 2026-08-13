// 完全覆盖 Next.js 15 的 params 类型，保持向后兼容
import 'next'

// 覆盖 Next.js 的核心类型
declare module 'next' {
  // 覆盖 PageProps 接口
  interface PageProps {
    params: Record<string, string>
    searchParams?: Record<string, string | string[] | undefined>
  }
  
  // 覆盖 generateMetadata 函数的参数类型
  interface MetadataProps {
    params: Record<string, string>
    searchParams?: Record<string, string | string[] | undefined>
  }
}

// 为所有动态路由页面提供统一的类型
export interface DynamicPageProps {
  params: Record<string, string>
  searchParams?: Record<string, string | string[] | undefined>
}

// 为博客页面提供专用类型
export interface BlogPageProps {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

// 为书本页面提供专用类型
export interface BookPageProps {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

// 为系列页面提供专用类型
export interface SeriesPageProps {
  params: { id: string }
  searchParams?: Record<string, string | string[] | undefined>
}

// 为分类页面提供专用类型
export interface CategoryPageProps {
  params: { slug: string }
  searchParams?: Record<string, string | string[] | undefined>
}
