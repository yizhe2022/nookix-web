/**
 * Schema.org 结构化数据生成器
 * 简化版本 - 参考竞品最佳实践
 * 只包含核心实体：BreadcrumbList、Book、AudioObject、Article
 */

import { SITE_URL } from '@/lib/site-config'

const BASE_URL = SITE_URL

/**
 * 格式化音频时长为 ISO 8601 格式
 * @param seconds 秒数
 * @returns ISO 8601 格式字符串 (例如: PT30M)
 */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return 'PT30M' // 默认30分钟
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  let duration = 'PT'
  if (hours > 0) duration += `${hours}H`
  if (minutes > 0) duration += `${minutes}M`
  if (secs > 0 && hours === 0) duration += `${secs}S`
  
  return duration || 'PT30M'
}

/**
 * 生成 BreadcrumbList 实体
 */
function generateBreadcrumb(book: any, bookUrl: string): any {
  const primaryGenre = book.genres?.[0]
  const primaryGenreName = primaryGenre?.name || 'Books'
  const primaryGenreSlug = primaryGenre?.slug || primaryGenreName.toLowerCase().replace(/\s+/g, '-')
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Books',
        item: BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: primaryGenreName,
        item: `${BASE_URL}/genres/${primaryGenreSlug}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: book.title,
        item: bookUrl
      }
    ]
  }
}

/**
 * 生成 Book 实体
 */
function generateBook(book: any, bookUrl: string): any {
  const bookSchema: any = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': bookUrl,
    url: bookUrl,
    name: book.title,
    description: book.description || book.summary || ''
  }
  
  // 添加作者
  if (book.authors) {
    const authorNames = book.authors.split(',').map((name: string) => name.trim())
    bookSchema.author = authorNames.map((name: string) => ({
      '@type': 'Person',
      name: name
    }))
  }
  
  // 添加出版年份（使用 publication_year 而不是 created_at）
  if (book.publication_year) {
    bookSchema.datePublished = book.publication_year.toString()
  }
  
  // 添加修改日期
  if (book.updated_at) {
    bookSchema.dateModified = book.updated_at
  }
  
  // 添加 ISBN13（修正字段名）
  if (book.isbn13 || book.ISBN) {
    bookSchema.isbn = book.isbn13 || book.ISBN
  }
  
  // 添加分类
  if (book.genres && book.genres.length > 0) {
    bookSchema.genre = book.genres[0].name
  }
  
  // 添加封面图片
  if (book.cover_image) {
    bookSchema.image = book.cover_image
  }
  
  // 添加评分
  if (book.ratings_count && book.ratings_count > 0) {
    bookSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: (book.average_rating || 4.5).toFixed(2),
      ratingCount: book.ratings_count.toString()
    }
  }
  
  return bookSchema
}

/**
 * Builds a Schema.org AudioObject for a published preview.
 */
function createPublishedAudioSchema(book: any, bookUrl: string): any | null {
  // Only publish schema when a preview URL is available.
  if (!book.preview_audio_url) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    name: `Audio Preview: ${book.title}${book.authors ? ' by ' + book.authors : ''}`,
    description: `Free audio preview of the key takeaways from ${book.title}${book.authors ? ' by ' + book.authors : ''}`,
    contentUrl: book.preview_audio_url,
    encodingFormat: 'audio/mpeg',
    duration: 'PT5M', // 试听片段固定为 5 分钟
    uploadDate: book.publication_year?.toString() || book.created_at || '2024-01-01',
    inLanguage: 'en',
    isAccessibleForFree: true, // 标记为免费可访问
    provider: {
      '@type': 'Organization',
      name: 'Nookix',
      url: BASE_URL
    }
  }
}

/**
 * 生成 Article 实体（用于 SEO）
 */
function generateArticle(book: any, bookUrl: string): any {
  const article: any = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': bookUrl
    },
    headline: `${book.title} Summary & Key Takeaways`
  }

  if (book.cover_image) {
    article.image = book.cover_image
  }

  if (book.updated_at) {
    article.dateModified = book.updated_at
  }

  if (book.publication_year) {
    article.datePublished = book.publication_year.toString()
  }

  return article
}

/**
 * 生成完整的 Schema.org 数组结构（简化版）
 * @param book 书本数据
 * @param canonicalSlug 规范化的 slug
 * @returns Schema.org JSON-LD 数组
 */
export function generateBookSchema(book: any, canonicalSlug: string): any[] {
  const bookUrl = `${BASE_URL}/book/${canonicalSlug}`
  
  const schemas: any[] = [
    generateBreadcrumb(book, bookUrl),
    generateBook(book, bookUrl),
    createPublishedAudioSchema(book, bookUrl),
    generateArticle(book, bookUrl)
  ].filter(Boolean) // 过滤掉 null/undefined
  
  return schemas
}
