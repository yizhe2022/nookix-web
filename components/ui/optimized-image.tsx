import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

/**
 * 优化的图片组件，支持现代格式、自适应大小和性能优化
 * @param props - 图片属性
 * @returns 优化的图片组件
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  // 核心优化：如果是 priority 首屏图片，初始状态直接设为 false，跳过动画和骨架屏
  const [isLoading, setIsLoading] = useState(!priority)
  const [error, setError] = useState(false)

  // 处理图片加载状态 (仅对非 priority 图片有意义)
  const handleLoad = () => {
    if (!priority) {
      setIsLoading(false)
    }
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false) // 即使错误也要取消 loading
  }

  // 如果加载失败，显示占位符
  if (error) {
    return (
      <div 
        className={cn(
          'bg-gray-100 flex items-center justify-center border border-gray-200',
          className
        )}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
        }}
      >
        <span className="text-gray-400 text-xs text-center px-2">图片无法加载</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={cn(
          // 核心优化：非首屏图片才应用渐进式过渡动画
          !priority && 'transition-opacity duration-300',
          // 如果正在加载（且不是高优图片），才将透明度设为 0
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        priority={priority}
        sizes={sizes}
        fill={fill}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {/* 核心优化：首屏高优图片不渲染灰色的脉冲节点，节省 DOM 树和计算资源 */}
      {!priority && isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  )
}