// 全局类型声明，覆盖 Next.js 15 的类型约束
declare global {
  // 覆盖 Next.js 的 PageProps 类型
  namespace NodeJS {
    interface Global {
      PageProps: any
    }
  }
}

// 直接覆盖 Next.js 模块
declare module 'next' {
  // 完全重写 PageProps 接口
  interface PageProps {
    params: Record<string, string>
    searchParams?: Record<string, string | string[] | undefined>
  }
  
  // 重写 generateMetadata 函数的参数类型
  interface MetadataProps {
    params: Record<string, string>
    searchParams?: Record<string, string | string[] | undefined>
  }
}

// 确保这个文件被识别为模块
export {}
