/**
 * 音频播放工具函数
 * 用于处理不同用户状态下的音频播放逻辑
 */

import { TimelineItem, BookTranscriptItem } from './types'

/**
 * 获取音频源 URL
 * @param book - 书本数据
 * @param isAuthenticated - 是否已登录
 * @returns 音频 URL 或 null
 */
export const getAudioSource = (
  book: any,
  isAuthenticated: boolean
): string | null => {
  if (!book) return null
  
  if (!isAuthenticated) {
    // 未登录：优先使用预览音频，否则使用完整音频
    return book.preview_audio_url || book.summary_audio || null
  }
  
  // 已登录：使用完整音频
  return book.summary_audio || null
}

/**
 * 获取播放限制时间（秒）
 * @param book - 书本数据
 * @param isAuthenticated - 是否已登录
 * @param isPremium - 是否为会员
 * @returns 限制时间（秒）或 null（无限制）
 */
export const getPlaybackLimit = (
  book: any,
  isAuthenticated: boolean,
  isPremium: boolean
): number | null => {
  // 未登录或会员：无限制
  if (!isAuthenticated || isPremium) {
    return null
  }
  
  // 已登录非会员：限制到第一个 transcript 时间戳
  if (book?.book_transcript && Array.isArray(book.book_transcript) && book.book_transcript.length > 0) {
    const firstTimestamp = book.book_transcript[0]?.timestamp
    return typeof firstTimestamp === 'number' ? firstTimestamp : 300 // 默认 5 分钟
  }
  
  return 300 // 默认 5 分钟
}

/**
 * 获取播放按钮文案
 * @param book - 书本数据
 * @param isAuthenticated - 是否已登录
 * @param isPremium - 是否为会员
 * @returns 按钮文案
 */
export const getPlayButtonText = (
  book: any,
  isAuthenticated: boolean,
  isPremium: boolean
): string => {
  if (!book) return "Start Listening"
  
  return "Start Listening"
}

/**
 * 格式化时间戳为 MM:SS
 * @param seconds - 秒数
 * @returns 格式化的时间字符串
 */
export const formatTimestamp = (seconds: number): string => {
  if (typeof seconds !== 'number' || seconds < 0) {
    return '0:00'
  }
  
  const roundedSeconds = Math.round(seconds)
  const mins = Math.floor(roundedSeconds / 60)
  const secs = roundedSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 验证 timeline 数据格式
 * @param timeline - 待验证的数据
 * @returns 是否为有效的 timeline 数据
 */
export const validateTimeline = (timeline: any): timeline is TimelineItem[] => {
  if (!Array.isArray(timeline)) return false
  
  return timeline.every(item => 
    typeof item === 'object' &&
    item !== null &&
    typeof item.timestamp === 'number' &&
    item.timestamp >= 0 &&
    typeof item.title === 'string' &&
    item.title.length > 0 &&
    item.title.length <= 200 &&
    typeof item.content === 'string' &&
    item.content.length >= 0 &&
    item.content.length <= 5000  // 限制正文最大长度为 5000 字符
  )
}

/**
 * 验证 book_transcript 数据格式
 * @param transcript - 待验证的数据
 * @returns 是否为有效的 transcript 数据
 */
export const validateBookTranscript = (transcript: any): transcript is BookTranscriptItem[] => {
  if (!Array.isArray(transcript)) return false
  
  return transcript.every(item => 
    typeof item === 'object' &&
    item !== null &&
    typeof item.timestamp === 'number' &&
    item.timestamp >= 0 &&
    typeof item.text === 'string'
  )
}

/**
 * 检查用户是否可以播放完整音频
 * @param isAuthenticated - 是否已登录
 * @param isPremium - 是否为会员
 * @param bookIsPremium - 书本是否为会员专属
 * @returns 是否可以播放完整音频
 */
export const canPlayFullAudio = (
  isAuthenticated: boolean,
  isPremium: boolean,
  bookIsPremium: boolean
): boolean => {
  // 未登录：不能播放完整音频
  if (!isAuthenticated) return false
  
  // 书本不是会员专属：可以播放
  if (!bookIsPremium) return true
  
  // 书本是会员专属：需要是会员才能播放
  return isPremium
}
