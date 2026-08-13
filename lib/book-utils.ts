import pb from '@/lib/pocketbase'

/**
 * 获取音频文件的时长 - 优化版本：使用后端API解析 (Range Request)
 * @param audioUrl 音频文件URL
 * @returns Promise<number> 时长（秒）
 */
function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise(async (resolve) => {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      resolve(0)
      return
    }

    try {
      // 调用我们新创建的 API
      const response = await fetch('/api/utils/audio-duration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: audioUrl })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      // 确保返回的是数字
      const duration = Number(data.duration)
      resolve(isNaN(duration) ? 0 : duration)

    } catch (error) {
      console.warn('Failed to get audio duration via API, falling back to basic checks or returning 0:', error)
      // 如果API失败，可以考虑这里降级到 new Audio()，或者直接返回 0
      // 为了性能，我们暂时直接返回 0，避免卡顿
      resolve(0)
    }
  })
}

/**
 * 计算书本的总时长（基于所有章节的音频时长）
 * @param bookId 书本ID
 * @returns 格式化的时长字符串
 */
export async function calculateBookTotalDuration(bookId: string): Promise<string> {
  try {
    // 获取书本的所有章节
    const chapters = await pb.collection('chapters').getFullList({
      filter: `book = "${bookId}"`,
      sort: 'order'
    })

    if (!chapters || chapters.length === 0) {
      return 'Unknown'
    }

    // 1. 优先使用预计算的章节时长
    const chaptersWithDuration = chapters.filter(chapter =>
      chapter.chapter_duration_seconds && chapter.chapter_duration_seconds > 0
    )

    // 如果所有章节都有预计算时长，直接使用
    if (chaptersWithDuration.length === chapters.length) {
      const totalSeconds = chaptersWithDuration.reduce((sum, chapter) =>
        sum + (chapter.chapter_duration_seconds || 0), 0
      )
      return formatSeconds(totalSeconds)
    }

    // 2. 如果有缺失，尝试实时计算 (现在使用快速 API)
    console.log(`🎵 部分章节缺少时长，尝试通过 API 快速计算...`)
    let totalSeconds = 0

    // 并行获取所有音频文件的时长
    const durationPromises = chapters.map(async (chapter) => {
      // 如果已有时长，直接返回
      if (chapter.chapter_duration_seconds && chapter.chapter_duration_seconds > 0) {
        return chapter.chapter_duration_seconds
      }

      // 如果没有，且有音频文件，调用API计算
      if (chapter.audio_file) {
        try {
          const audioUrl = pb.files.getURL(chapter, chapter.audio_file)
          const duration = await getAudioDuration(audioUrl)
          return duration
        } catch (error) {
          console.warn(`❌ Calc duration failed for chapter ${chapter.id}`, error)
          return 0
        }
      }
      return 0
    })

    // 等待所有时长计算完成
    const durations = await Promise.all(durationPromises)
    totalSeconds = durations.reduce((sum, duration) => sum + duration, 0)

    if (totalSeconds === 0) {
      return 'Unknown'
    }

    return formatSeconds(totalSeconds)

  } catch (error) {
    console.error('Failed to calculate book total duration:', error)
    return 'Unknown'
  }
}

/**
 * 辅助函数：格式化秒数为可读字符串
 */
function formatSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Unknown'

  const totalMinutes = Math.ceil(totalSeconds / 60)
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (minutes > 0) {
      return `${hours}h ${minutes}min`
    } else {
      return `${hours}h`
    }
  } else {
    return `${totalMinutes}min`
  }
}

/**
 * 批量计算多个书本的总时长
 * @param books 书本数组
 * @returns 包含时长信息的书本数组
 */
export async function addDurationToBooks<T extends { id: string }>(books: T[]): Promise<(T & { calculatedDuration: string })[]> {
  // 恢复批量计算逻辑，因为现在由 API 处理，速度应该可以接受
  // 但为了保险，我们只对没有预设计算时长的书本进行计算？
  // 或者全部重新计算确保准确？
  // 考虑到列表页性能，并行请求过多可能会对服务器造成压力 (API Route 并发)
  // 建议：列表页如果数据量大，最好还是依赖数据库存储的字段。
  // 但既然用户要求“不再经常要计算很久”，说明后端存储可能不完整。
  // 我们这里限制一下并发，或者直接并行请求。Next.js API 处理并发能力还可以。

  const booksWithDuration = await Promise.all(
    books.map(async (book) => {
      // 这里 calculateBookTotalDuration 内部会优先用数据库字段，缺失才会调 API
      const duration = await calculateBookTotalDuration(book.id)
      return {
        ...book,
        calculatedDuration: duration
      }
    })
  )

  return booksWithDuration
}

/**
 * 同步版本：基于已有的章节数据计算总时长
 * @param chapters 章节数组
 * @returns 格式化的时长字符串
 */
export function calculateDurationFromChapters(chapters: any[]): string {
  if (!chapters || chapters.length === 0) {
    return 'Unknown'
  }

  const totalSeconds = chapters.reduce((total, chapter) => {
    return total + (chapter.chapter_duration_seconds || 0)
  }, 0)

  return formatSeconds(totalSeconds)
}
