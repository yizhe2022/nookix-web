import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface LazyLoadProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
}

/**
 * 懒加载组件 - 当元素进入视口时才渲染内容
 * @param props - 组件属性
 * @returns 懒加载组件
 */
export default function LazyLoad({
  children,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder,
  onLoad,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true)
      onLoad?.()
    }
  }, [isVisible, hasLoaded, onLoad])

  return (
    <div ref={ref} className={cn('lazy-load', className)}>
      {isVisible ? (
        <div className="lazy-content">{children}</div>
      ) : (
        <div className="lazy-placeholder">
          {placeholder || (
            <div className="animate-pulse bg-gray-200 rounded">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 图片懒加载组件
 */
interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  onLoad,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleIntersection = () => {
    setImageSrc(src)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleImageError = () => {
    setError(true)
    setIsLoading(false)
  }

  if (error) {
    return (
      <div className={cn('bg-gray-200 flex items-center justify-center', className)}>
        <span className="text-gray-500 text-sm">图片加载失败</span>
      </div>
    )
  }

  return (
    <LazyLoad
      className={className}
      onLoad={handleIntersection}
      placeholder={placeholder}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </LazyLoad>
  )
} 