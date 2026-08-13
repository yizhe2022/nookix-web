/**
 * 播放记录服务
 * 处理用户的播放历史记录和进度更新
 * 
 * 迁移说明：已从 PocketBase 迁移到 Supabase
 * 注意：业务模型中一本书只有一个音频，不需要 chapter 字段
 */

import { createClient } from "@/utils/supabase/client"

export interface ReadingHistoryRecord {
  id?: string
  user_id: string
  book_id: string
  current_position: number
  progress: number
  last_played: string
  created_at?: string
  updated_at?: string
}

/**
 * 更新或创建播放记录
 * @param bookId 书本ID
 * @param position 当前播放位置（秒）
 * @param totalProgress 整本书的播放进度（0-1）
 * @returns 操作结果
 */
export async function updateReadingHistory(
  bookId: string,
  position: number = 0,
  totalProgress: number = 0
): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    console.log('[updateReadingHistory] 开始执行，参数:', { bookId, position, totalProgress })

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[updateReadingHistory] 用户未登录')
      return {
        success: false,
        message: '用户未登录'
      }
    }

    const currentUserId = user.id

    if (!bookId || typeof bookId !== 'string') {
      console.error('[updateReadingHistory] bookId 无效:', bookId)
      return { success: false, message: 'bookId 无效' }
    }

    const validPosition = Math.max(0, Math.floor(Number(position) || 0))
    const validProgress = Math.min(Math.max(Number(totalProgress) || 0, 0), 1)

    console.log('[updateReadingHistory] 校验后参数:', { bookId, validPosition, validProgress })

    if (validProgress === 0 && validPosition === 0) {
      console.log('[updateReadingHistory] 跳过保存：进度和位置都为 0')
      return {
        success: true,
        message: '跳过保存空进度'
      }
    }

    console.log('[updateReadingHistory] 查询现有记录...')
    const { data: existingRecords, error: queryError } = await supabase
      .from('user_reading_history')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('book_id', bookId)
      .limit(1)

    if (queryError) {
      console.error('[updateReadingHistory] 查询失败:', queryError)
      return {
        success: false,
        message: '查询失败'
      }
    }

    const updateData: any = {
      current_position: validPosition,
      progress: validProgress,
      last_played: new Date().toISOString()
    }

    console.log('[updateReadingHistory] 准备发送的数据:', JSON.stringify(updateData, null, 2))

    let record

    if (existingRecords && existingRecords.length > 0) {
      const recordId = existingRecords[0].id
      console.log('[updateReadingHistory] 更新现有记录，ID:', recordId)

      const { data, error } = await supabase
        .from('user_reading_history')
        .update(updateData)
        .eq('id', recordId)
        .select()
        .single()

      if (error) {
        console.error('[updateReadingHistory] 更新失败:', error)
        console.error('[updateReadingHistory] 错误详情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return {
          success: false,
          message: `更新失败: ${error.message || '未知错误'}`
        }
      }

      record = data
      console.log('[updateReadingHistory] 更新成功:', JSON.stringify(record, null, 2))
    } else {
      const createData = {
        user_id: currentUserId,
        book_id: bookId,
        current_position: validPosition,
        progress: validProgress,
        last_played: new Date().toISOString()
      }

      console.log('[updateReadingHistory] 创建新记录，数据:', JSON.stringify(createData, null, 2))

      const { data, error } = await supabase
        .from('user_reading_history')
        .insert(createData)
        .select()
        .single()

      if (error) {
        console.error('[updateReadingHistory] 创建失败:', error)
        console.error('[updateReadingHistory] 错误详情:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return {
          success: false,
          message: `创建失败: ${error.message || '未知错误'}`
        }
      }

      record = data
      console.log('[updateReadingHistory] 创建成功:', JSON.stringify(record, null, 2))
    }

    return {
      success: true,
      message: '播放记录已更新',
      data: record
    }
  } catch (error) {
    console.error('[updateReadingHistory] 发生错误:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 获取用户的播放历史记录
 * @param limit 限制数量
 * @returns 播放历史记录列表
 */
export async function getReadingHistory(limit: number = 50): Promise<{
  success: boolean
  data: any[]
  message?: string
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        data: [],
        message: '用户未登录'
      }
    }

    const { data: records, error } = await supabase
      .from('user_reading_history')
      .select(`
        *,
        books (
          id,
          title,
          authors,
          cover_image,
          slug
        )
      `)
      .eq('user_id', user.id)
      .order('last_played', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取播放历史失败:', error)
      return {
        success: false,
        data: [],
        message: '获取播放历史失败'
      }
    }

    return {
      success: true,
      data: records || []
    }
  } catch (error) {
    console.error('获取播放历史失败:', error)
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}

/**
 * 删除播放历史记录
 * @param recordId 记录ID
 * @returns 操作结果
 */
export async function deleteReadingHistory(recordId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        success: false,
        message: '用户未登录'
      }
    }

    const { error } = await supabase
      .from('user_reading_history')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('删除播放历史失败:', error)
      return {
        success: false,
        message: '删除失败'
      }
    }

    return {
      success: true,
      message: '删除成功'
    }
  } catch (error) {
    console.error('删除播放历史失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '未知错误'
    }
  }
}
