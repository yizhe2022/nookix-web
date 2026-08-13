/**
 * 客户端缓存工具
 * 使用 sessionStorage 实现简单的缓存机制
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresIn: number // 毫秒
}

/**
 * 从缓存中获取数据
 * @param key 缓存键
 * @returns 缓存的数据，如果过期或不存在则返回 null
 */
export function getFromCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = sessionStorage.getItem(key)
    if (!cached) return null

    const item: CacheItem<T> = JSON.parse(cached)
    const now = Date.now()

    // 检查是否过期
    if (now - item.timestamp > item.expiresIn) {
      sessionStorage.removeItem(key)
      return null
    }

    return item.data
  } catch (error) {
    console.error('[Cache] Failed to get from cache:', error)
    return null
  }
}

/**
 * 将数据存入缓存
 * @param key 缓存键
 * @param data 要缓存的数据
 * @param expiresIn 过期时间（毫秒）
 */
export function setToCache<T>(key: string, data: T, expiresIn: number): void {
  if (typeof window === 'undefined') return

  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    }
    sessionStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error('[Cache] Failed to set to cache:', error)
  }
}

/**
 * 清除指定缓存
 * @param key 缓存键
 */
export function clearCache(key: string): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.removeItem(key)
  } catch (error) {
    console.error('[Cache] Failed to clear cache:', error)
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.clear()
  } catch (error) {
    console.error('[Cache] Failed to clear all cache:', error)
  }
}

/**
 * 检查缓存是否存在且未过期
 * @param key 缓存键
 * @returns 是否有效
 */
export function isCacheValid(key: string): boolean {
  return getFromCache(key) !== null
}

// 预定义的缓存键
export const CACHE_KEYS = {
  FOR_YOU_MODULES: 'dashboard:for-you:modules',
  EXPLORE_MODULES: 'dashboard:explore:modules',
  EXPLORE_GENRES: 'dashboard:explore:genres',
  LIBRARY_BOOKS: 'dashboard:library:books',
  READING_HISTORY: 'dashboard:library:history',
} as const

// 预定义的缓存时长（毫秒）
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 分钟
  MEDIUM: 30 * 60 * 1000,    // 30 分钟
  LONG: 60 * 60 * 1000,      // 1 小时
} as const
