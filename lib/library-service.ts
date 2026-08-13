/**
 * Library Service - Supabase Implementation
 * 处理用户图书馆和阅读历史
 */

import { createClient } from '@/utils/supabase/client'

export interface LibraryBook {
  id: string
  slug?: string // 添加 slug 字段
  libraryItemId: string
  title: string
  author: string
  cover: string
  rating: number
  duration: string
  isPremium: boolean
  summary_audio?: string | string[]
  audioDurationSeconds?: number
  progress: number // 0-100 百分比
  currentPosition?: number
  lastPlayed?: string
  last_read_at?: string // 添加 last_read_at 字段（用于排序）
  added_at?: string // 添加 added_at 字段
  created_at?: string // 添加 created_at 字段
}

export interface ReadingHistoryRecord {
  id: string
  user_id: string
  book_id: string
  current_position: number
  progress: number // 0-1 小数
  last_played: string
  created_at?: string
  updated_at?: string
}

/**
 * 获取用户图书馆
 */
export async function getUserLibrary(userId: string, accessToken: string): Promise<{
  success: boolean
  data: LibraryBook[]
  message?: string
}> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?user_id=eq.${userId}&select=id,book_id,created_at,books(id,slug,title,authors,cover_image,rating,audio_duration,is_premium)&order=created_at.desc`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[getUserLibrary] API Error:', response.status, errorText)
      throw new Error(`Failed to fetch library: ${response.status}`)
    }

    const libraryData = await response.json()

    // 获取阅读历史以获取最新进度
    const historyResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_reading_history?user_id=eq.${userId}&select=book_id,progress`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    const historyData = historyResponse.ok ? await historyResponse.json() : []
    const progressMap = new Map(historyData.map((h: any) => [h.book_id, h.progress]))

    const booksWithNulls: (LibraryBook | null)[] = libraryData.map((item: any) => {
      const book = item.books
      if (!book) return null

      // 从阅读历史中获取进度（user_library.progress 已移除）
      const latestProgress = progressMap.get(book.id) || 0

      return {
        id: book.id,
        slug: book.slug, // 添加 slug 字段
        libraryItemId: item.id,
        title: book.title,
        author: book.authors || book.author || 'Unknown',
        cover: book.cover_image || '',
        rating: book.rating || 0,
        duration: book.audio_duration && book.audio_duration > 0
          ? formatDuration(book.audio_duration)
          : 'Unknown',
        isPremium: book.is_premium || false,
        progress: (Number(latestProgress) || 0) * 100, // 转换为百分比
        added_at: item.created_at,
        created_at: item.created_at,
      }
    })
    
    const books: LibraryBook[] = booksWithNulls.filter((book): book is LibraryBook => book !== null)

    return {
      success: true,
      data: books
    }
  } catch (error) {
    console.error('Failed to fetch library:', error)
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch library'
    }
  }
}

/**
 * 获取阅读历史
 */
export async function getReadingHistory(userId: string, accessToken: string, limit: number = 100): Promise<{
  success: boolean
  data: LibraryBook[]
  message?: string
}> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_reading_history?user_id=eq.${userId}&progress=gt.0&select=id,book_id,progress,current_position,last_played,books(id,slug,title,authors,cover_image,rating,audio_duration,is_premium,summary_audio)&order=last_played.desc&limit=${limit}`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[getReadingHistory] API Error:', response.status, errorText)
      throw new Error(`Failed to fetch reading history: ${response.status}`)
    }

    const historyData = await response.json()

    // 去重：按 book_id 去重，只保留最新的记录
    const uniqueBooks = new Map()
    historyData.forEach((item: any) => {
      if (!uniqueBooks.has(item.book_id) ||
          new Date(item.last_played) > new Date(uniqueBooks.get(item.book_id).last_played)) {
        uniqueBooks.set(item.book_id, item)
      }
    })

    const booksWithNulls: (LibraryBook | null)[] = Array.from(uniqueBooks.values()).map((item: any) => {
      const book = item.books
      if (!book) return null

      return {
        id: book.id,
        slug: book.slug, // 添加 slug 字段
        libraryItemId: item.id, // 使用 reading_history 的 ID
        title: book.title,
        author: book.authors || book.author || 'Unknown',
        cover: book.cover_image || '',
        rating: book.rating || 0,
        duration: book.audio_duration && book.audio_duration > 0
          ? formatDuration(book.audio_duration)
          : 'Unknown',
        isPremium: book.is_premium || false,
        summary_audio: book.summary_audio,
        audioDurationSeconds: typeof book.audio_duration === 'number' ? book.audio_duration : undefined,
        progress: item.progress * 100, // 转换为百分比
        currentPosition: item.current_position || 0,
        lastPlayed: item.last_played,
        last_read_at: item.last_played,
      }
    })
    
    const books: LibraryBook[] = booksWithNulls.filter((book): book is LibraryBook => book !== null)

    return {
      success: true,
      data: books
    }
  } catch (error) {
    console.error('Failed to fetch reading history:', error)
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch reading history'
    }
  }
}

/**
 * 从图书馆删除书籍
 */
export async function removeFromLibrary(libraryItemId: string, accessToken: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?id=eq.${libraryItemId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to remove from library')
    }

    return {
      success: true,
      message: 'Removed from library'
    }
  } catch (error) {
    console.error('Failed to remove from library:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove from library'
    }
  }
}

/**
 * 从阅读历史删除记录
 */
export async function deleteReadingHistory(recordId: string, accessToken: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_reading_history?id=eq.${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete reading history')
    }

    return {
      success: true,
      message: 'Deleted from reading history'
    }
  } catch (error) {
    console.error('Failed to delete reading history:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete reading history'
    }
  }
}

/**
 * 格式化音频时长
 */
function formatDuration(audioDuration: number): string {
  if (!audioDuration || audioDuration <= 0) {
    return 'Unknown'
  }

  return `${Math.ceil(audioDuration / 60)}min`
}

/**
 * 添加书籍到用户图书馆（不会重复添加）
 */
export async function addBookToLibrary(bookId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    // 检查是否已在图书馆中
    const checkResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?user_id=eq.${session.user.id}&book_id=eq.${bookId}&select=id`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    )

    const existing = await checkResponse.json()

    if (existing && existing.length > 0) {
      // 已存在，不需要重复添加
      return {
        success: true,
        message: 'Already in library'
      }
    }

    // 添加到图书馆
    const addResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: session.user.id,
          book_id: bookId
        })
      }
    )

    if (!addResponse.ok) {
      throw new Error('Failed to add to library')
    }

    return {
      success: true,
      message: 'Added to library'
    }
  } catch (error) {
    console.error('Failed to add book to library:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add to library'
    }
  }
}

/**
 * 检查书籍是否在用户图书馆中
 */
export async function isBookInLibrary(bookId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return false
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?user_id=eq.${session.user.id}&book_id=eq.${bookId}&select=id`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    )

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data && data.length > 0
  } catch (error) {
    console.error('Failed to check if book is in library:', error)
    return false
  }
}

/**
 * 切换书籍在图书馆中的状态（添加或移除）
 */
export async function toggleBookInLibrary(bookId: string): Promise<{
  success: boolean
  isInLibrary: boolean
  message: string
}> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return {
        success: false,
        isInLibrary: false,
        message: 'User not authenticated'
      }
    }

    // 检查是否已在图书馆中
    const checkResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?user_id=eq.${session.user.id}&book_id=eq.${bookId}&select=id`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    )

    const existing = await checkResponse.json()

    if (existing && existing.length > 0) {
      // 已存在，删除
      const deleteResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library?id=eq.${existing[0].id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      )

      if (!deleteResponse.ok) {
        throw new Error('Failed to remove from library')
      }

      return {
        success: true,
        isInLibrary: false,
        message: 'Removed from library'
      }
    } else {
      // 不存在，添加
      const addResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_library`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: session.user.id,
            book_id: bookId
          })
        }
      )

      if (!addResponse.ok) {
        throw new Error('Failed to add to library')
      }

      return {
        success: true,
        isInLibrary: true,
        message: 'Added to library'
      }
    }
  } catch (error) {
    console.error('Failed to toggle book in library:', error)
    return {
      success: false,
      isInLibrary: false,
      message: error instanceof Error ? error.message : 'Failed to toggle book in library'
    }
  }
}
