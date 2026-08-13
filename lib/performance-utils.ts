/**
 * 性能优化工具函数集合
 */

/**
 * 防抖函数 - 延迟执行，避免频繁调用
 * @param func - 要执行的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数 - 限制函数执行频率
 * @param func - 要执行的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 懒加载 Intersection Observer
 * @param callback - 当元素进入视口时执行的回调
 * @param options - Intersection Observer 选项
 * @returns Intersection Observer 实例
 */
export function createLazyLoadObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  }
  
  return new IntersectionObserver(callback, defaultOptions)
}

/**
 * 预加载图片
 * @param src - 图片URL
 * @returns Promise<HTMLImageElement>
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 批量预加载图片
 * @param urls - 图片URL数组
 * @returns Promise<HTMLImageElement[]>
 */
export function preloadImages(urls: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(urls.map(preloadImage))
}

/**
 * 检测设备性能
 * @returns 性能信息对象
 */
export function getDevicePerformance(): {
  isSlowDevice: boolean
  connectionType: string
  effectiveType: string
} {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  return {
    isSlowDevice: navigator.hardwareConcurrency <= 2,
    connectionType: connection?.effectiveType || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
  }
}

/**
 * 优化的事件监听器
 * @param element - 目标元素
 * @param event - 事件类型
 * @param handler - 事件处理函数
 * @param options - 事件选项
 */
export function addOptimizedEventListener(
  element: EventTarget,
  event: string,
  handler: EventListener,
  options: AddEventListenerOptions = {}
): () => void {
  const optimizedHandler = throttle(handler, 16) // 60fps
  element.addEventListener(event, optimizedHandler, options)
  
  return () => {
    element.removeEventListener(event, optimizedHandler, options)
  }
}

/**
 * 资源预加载
 * @param resources - 要预加载的资源数组
 */
export function preloadResources(resources: Array<{ href: string; as: string; type?: string }>): void {
  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    document.head.appendChild(link)
  })
}

/**
 * 检测是否支持现代浏览器特性
 * @returns 支持的特性对象
 */
export function getBrowserSupport(): {
  webp: boolean
  avif: boolean
  webgl: boolean
  serviceWorker: boolean
} {
  const canvas = document.createElement('canvas')
  const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
    webgl: !!webgl,
    serviceWorker: 'serviceWorker' in navigator,
  }
} 