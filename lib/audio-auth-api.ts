/**
 * Audio Authentication API
 * 
 * 提供音频文件签名 URL 的请求、缓存和刷新功能
 * 
 * 功能：
 * 1. 从后端获取签名 URL
 * 2. 缓存 URL 到 localStorage
 * 3. 自动刷新即将过期的 URL
 * 4. 处理认证和授权错误
 * 5. 实现重试机制
 */

import pb from './pocketbase'

// 常量配置
const CACHE_KEY_PREFIX = 'audio_url_'
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 50
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // 指数退避：1s, 2s, 4s

// 类型定义
export interface SignedUrlResponse {
  url: string
  expiresIn: number  // 过期时间（秒）
  isPremium: boolean
}

export interface CachedUrl {
  url: string
  expiresAt: number  // Unix timestamp (毫秒)
  bookId: string
  // chapterId removed: 业务模型中一本书 = 一个完整音频
  cachedAt: number   // 缓存时间戳
}

export interface AudioTokenRequest {
  bookId: string
  // chapterId removed: 业务模型中一本书 = 一个完整音频
}

// 错误类型
export class AudioAuthError extends Error {
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'PREMIUM_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'NETWORK_ERROR' | 'UNKNOWN',
    public isPremium?: boolean
  ) {
    super(message)
    this.name = 'AudioAuthError'
  }
}

/**
 * 获取缓存键
 */
function getCacheKey(bookId: string): string {
  return `${CACHE_KEY_PREFIX}${bookId}`
}

/**
 * 从 localStorage 获取缓存的 URL
 */
function getCachedUrl(bookId: string): CachedUrl | null {
  try {
    const key = getCacheKey(bookId)
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const parsed: CachedUrl = JSON.parse(cached)
    
    // 检查是否过期
    if (Date.now() >= parsed.expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('[Audio Auth] Failed to get cached URL:', error)
    return null
  }
}

/**
 * 缓存 URL 到 localStorage
 */
function setCachedUrl(
  bookId: string,
  url: string,
  expiresIn: number
): void {
  try {
    const key = getCacheKey(bookId)
    const expiresAt = Date.now() + (expiresIn * 1000)
    
    const cached: CachedUrl = {
      url,
      expiresAt,
      bookId,
      cachedAt: Date.now()
    }
    
    localStorage.setItem(key, JSON.stringify(cached))
    
    // 检查缓存大小并清理
    enforceCacheLimit()
  } catch (error) {
    console.error('[Audio Auth] Failed to cache URL:', error)
  }
}

/**
 * 强制执行缓存大小限制
 */
function enforceCacheLimit(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX))
    
    if (keys.length <= MAX_CACHE_SIZE) return
    
    // 获取所有缓存条目并按 cachedAt 排序
    const entries = keys.map(key => {
      try {
        const cached = JSON.parse(localStorage.getItem(key)!)
        return { key, cachedAt: cached.cachedAt || 0 }
      } catch {
        return { key, cachedAt: 0 }
      }
    }).sort((a, b) => a.cachedAt - b.cachedAt)
    
    // 删除最旧的条目
    const toDelete = entries.slice(0, keys.length - MAX_CACHE_SIZE)
    toDelete.forEach(entry => localStorage.removeItem(entry.key))
    
    console.log(`[Audio Auth] Removed ${toDelete.length} old cache entries`)
  } catch (error) {
    console.error('[Audio Auth] Failed to enforce cache limit:', error)
  }
}

/**
 * 清理过期的缓存条目
 */
export function cleanupExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX))
    const now = Date.now()
    let cleanedCount = 0
    
    for (const key of keys) {
      try {
        const cached = JSON.parse(localStorage.getItem(key)!)
        if (now >= cached.expiresAt) {
          localStorage.removeItem(key)
          cleanedCount++
        }
      } catch {
        // 无效的缓存条目，删除
        localStorage.removeItem(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[Audio Auth] Cleaned up ${cleanedCount} expired cache entries`)
    }
  } catch (error) {
    console.error('[Audio Auth] Failed to cleanup expired cache:', error)
  }
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试的 fetch
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      
      // 如果成功或是客户端错误（4xx），直接返回
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      
      // 5xx 错误，继续重试
      if (i < retries - 1) {
        console.log(`[Audio Auth] Request failed with ${response.status}, retrying in ${RETRY_DELAYS[i]}ms...`)
        await delay(RETRY_DELAYS[i])
      }
    } catch (error) {
      // 网络错误，继续重试
      if (i < retries - 1) {
        console.log(`[Audio Auth] Network error, retrying in ${RETRY_DELAYS[i]}ms...`, error)
        await delay(RETRY_DELAYS[i])
      } else {
        throw new AudioAuthError(
          'Network error. Please check your connection and try again',
          'NETWORK_ERROR'
        )
      }
    }
  }
  
  throw new AudioAuthError(
    'Max retries exceeded',
    'NETWORK_ERROR'
  )
}

/**
 * 获取签名 URL（不使用缓存）
 * 
 * @param bookId - 书籍 ID
 * @returns 签名 URL 响应
 * @throws AudioAuthError
 */
export async function getSignedAudioUrl(
  bookId: string
): Promise<SignedUrlResponse> {
  try {
    console.log(`[Audio Auth] Requesting signed URL for book=${bookId}`)
    
    // 构建请求
    const url = `${pb.baseUrl}/api/audio-token`
    const body: AudioTokenRequest = { bookId }
    
    // 获取认证 token（确保使用最新的 token）
    const authToken = pb.authStore.token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // 只有在有 token 时才添加 Authorization header
    if (authToken) {
      headers['Authorization'] = authToken
    }
    
    console.log('[Audio Auth] Request headers:', { hasAuth: !!authToken })
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    // 处理错误响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      if (response.status === 401) {
        throw new AudioAuthError(
          'Please log in to listen to this audio',
          'UNAUTHORIZED'
        )
      }
      
      if (response.status === 403) {
        if (errorData.isPremium) {
          throw new AudioAuthError(
            'Upgrade to Premium to access this content',
            'PREMIUM_REQUIRED',
            true
          )
        } else {
          throw new AudioAuthError(
            'Access denied. Please refresh the page and try again',
            'FORBIDDEN'
          )
        }
      }
      
      if (response.status === 404) {
        throw new AudioAuthError(
          'Audio file not found',
          'NOT_FOUND'
        )
      }
      
      throw new AudioAuthError(
        errorData.error || 'Failed to get audio URL',
        'UNKNOWN'
      )
    }
    
    const data: SignedUrlResponse = await response.json()
    console.log(`[Audio Auth] Received signed URL, expires in ${data.expiresIn}s`)
    
    return data
  } catch (error) {
    if (error instanceof AudioAuthError) {
      throw error
    }
    
    console.error('[Audio Auth] Unexpected error:', error)
    throw new AudioAuthError(
      'An unexpected error occurred',
      'UNKNOWN'
    )
  }
}

/**
 * 获取签名 URL（优先使用缓存）
 * 
 * @param bookId - 书籍 ID
 * @returns 签名 URL 字符串
 * @throws AudioAuthError
 */
export async function getCachedSignedAudioUrl(
  bookId: string
): Promise<string> {
  // 检查缓存
  const cached = getCachedUrl(bookId)
  
  if (cached) {
    const timeUntilExpiry = cached.expiresAt - Date.now()
    
    // 如果缓存有效且剩余时间 > 5 分钟，使用缓存
    if (timeUntilExpiry > REFRESH_THRESHOLD_MS) {
      console.log(`[Audio Auth] Using cached URL (expires in ${Math.floor(timeUntilExpiry / 1000)}s)`)
      return cached.url
    }
    
    console.log(`[Audio Auth] Cached URL expires soon (${Math.floor(timeUntilExpiry / 1000)}s), refreshing...`)
  }
  
  // 缓存未命中或即将过期，请求新 URL
  const response = await getSignedAudioUrl(bookId)
  
  // 缓存新 URL
  setCachedUrl(bookId, response.url, response.expiresIn)
  
  return response.url
}

/**
 * 预加载音频 URL（用于提前缓存）
 * 
 * @param bookId - 书籍 ID
 */
export async function preloadAudioUrl(
  bookId: string
): Promise<void> {
  try {
    console.log(`[Audio Auth] Preloading audio URL for book=${bookId}`)
    
    // 后台预加载（不阻塞）
    await getCachedSignedAudioUrl(bookId)
    console.log(`[Audio Auth] Preloaded audio URL`)
  } catch (error) {
    // 预加载失败不影响当前播放
    console.warn('[Audio Auth] Failed to preload audio URL:', error)
  }
}

/**
 * 清除所有缓存的 URL
 */
export function clearAllCachedUrls(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX))
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`[Audio Auth] Cleared ${keys.length} cached URLs`)
  } catch (error) {
    console.error('[Audio Auth] Failed to clear cached URLs:', error)
  }
}

/**
 * 清除特定书籍的缓存 URL
 * 
 * @param bookId - 书籍 ID
 */
export function clearBookCachedUrls(bookId: string): void {
  try {
    const keys = Object.keys(localStorage).filter(k => 
      k.startsWith(CACHE_KEY_PREFIX) && k.includes(bookId)
    )
    keys.forEach(key => localStorage.removeItem(key))
    console.log(`[Audio Auth] Cleared ${keys.length} cached URLs for book ${bookId}`)
  } catch (error) {
    console.error('[Audio Auth] Failed to clear book cached URLs:', error)
  }
}
