import { Metadata } from 'next'
import { cache } from 'react'
import BookDetailContent from '@/components/book/book-detail-content'
import BookStaticContent from '@/components/book/book-static-content'
import BookFooterSections from '@/components/book/book-footer-sections'
import { ChevronRight } from 'lucide-react'
import { titleToSlug } from '@/lib/slug-utils'
import { getSlugForGenre } from '@/lib/genre-slugs'
import { notFound } from 'next/navigation'
import { getBookBySlug, getRelatedBooksByPrimaryGenre, getPopularBooks, getAllGenres, supabase } from '@/lib/supabase-service'
import { unstable_cache } from 'next/cache'
import { generateBookSchema } from '@/lib/schema-generator'
import { mergeMetadata } from '@/lib/seo-metadata'
import { SITE_URL, toSiteUrl } from '@/lib/site-config'

// 启用 ISR (12小时重新验证，平衡性能和内容新鲜度)
export const revalidate = 43200  // 12 hours
// export const dynamic = 'force-dynamic' // Removed to allow ISR

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('books')
    .select('slug')
    .eq('status', 'published')
    .not('slug', 'is', null)

  if (error) {
    console.error('❌ [BookPage] Failed to generate static params:', error)
    return []
  }

  return (data || [])
    .filter((book) => Boolean(book.slug))
    .map((book) => ({ id: book.slug }))
}

interface BookPageProps {
  params: Promise<{
    id: string
  }>
}


/**
 * 获取相关书籍
 * 基于当前书本的主 genre（sort_order = 0）推荐
 */
const getRelatedBooks = cache(async (book: any) => {
  if (!book) return []

  try {
    // 1. 获取当前书本的主 genre（sort_order = 0）
    const primaryGenre = book.genres?.find((g: any) => g.sort_order === 0) || book.genres?.[0]
    
    if (!primaryGenre) {
      console.warn('⚠️ [BookPage] 当前书本没有 genre，返回热门书籍')
      return await getPopularBooks(10)
    }
    
    console.log(`📚 [BookPage] 主 genre: ${primaryGenre.name} (${primaryGenre.id})`)
    
    // 2. 基于主 genre 获取相关书籍（rating > 4.0）
    const relatedBooks = await getRelatedBooksByPrimaryGenre(book.id, primaryGenre.id, 10)
    
    // 3. 如果相关书籍不足 4 本，补充热门书籍
    if (relatedBooks.length < 4) {
      console.log(`⚠️ [BookPage] 相关书籍不足 (${relatedBooks.length} 本)，补充热门书籍`)
      const popularBooks = await getPopularBooks(10)
      const excludeIds = new Set([book.id, ...relatedBooks.map(b => b.id)])
      const additionalBooks = popularBooks.filter(b => !excludeIds.has(b.id))
      return [...relatedBooks, ...additionalBooks].slice(0, 10)
    }
    
    return relatedBooks
  } catch (error) {
    console.error('Failed to fetch related books:', error)
    return []
  }
})

/**
 * 获取缓存的 Popular Books (24小时缓存)
 * 缓存 50 本书，查询时随机取 10 本（增加多样性，确保去重后仍有足够数量）
 */
const getCachedPopularBooks = unstable_cache(
  async () => {
    try {
      return await getPopularBooks(50)  // 缓存 50 本
    } catch (error) {
      console.error('Failed to fetch cached popular books:', error)
      return []
    }
  },
  ['global-popular-books-v3'],  // 更新缓存 key（v2 → v3）
  { revalidate: 86400 } // 缓存 24 小时
)

/**
 * 获取侧边栏数据 (Popular Books + Genres)
 */
const getCachedGenres = unstable_cache(
  async () => getAllGenres(),
  ['global-genres-list'],
  { revalidate: 86400 } // 缓存 24 小时
);

const getSidebarData = cache(async (book: any) => {
  if (!book) return { popularBooks: [], genres: [] }
  
  try {
    // 获取热门书籍和所有 genres
    const [cachedPopularBooks, allGenres] = await Promise.all([
      getCachedPopularBooks(),  // 获取 50 本缓存的热门书籍
      getCachedGenres()
    ])
    
    // 从 50 本中随机取 10 本（增加多样性，确保去重后仍有足够数量）
    const shuffled = cachedPopularBooks.sort(() => Math.random() - 0.5)
    const popularBooks = shuffled.slice(0, 10)
    
    // 获取当前书本的 genre IDs
    const bookGenreIds = new Set(
      (book.genres || []).map((g: any) => g.id)
    )
    
    // 获取当前书本的 categories
    const bookCategories = new Set(
      (book.genres || []).map((g: any) => g.category).filter(Boolean)
    )
    
    // 找到相同 category 但不同 genre 的 genres
    const relatedGenres = allGenres
      .filter(genre => 
        bookCategories.has(genre.category) && !bookGenreIds.has(genre.id)
      )
      .slice(0, 50)
      .map(genre => ({
        title: genre.name,
        slug: genre.slug || titleToSlug(genre.name),
        icon_emoji: genre.icon_emoji  // 添加 icon_emoji
      }))
    
    return {
      popularBooks,
      genres: relatedGenres
    }
  } catch (error) {
    console.error('Failed to fetch sidebar data:', error)
    return {
      popularBooks: [],
      genres: []
    }
  }
})

const truncateText = (value: string, maxLength: number) => {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

const parseJsonField = (value: unknown): any => {
  if (!value) return null
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const getTakeawayCount = (keyTakeaways: unknown) => {
  const parsed = parseJsonField(keyTakeaways)

  if (Array.isArray(parsed)) {
    return parsed.filter(Boolean).length
  }

  if (parsed && typeof parsed === 'object') {
    const values = Object.values(parsed)
    const arrayValue = values.find(Array.isArray)
    if (Array.isArray(arrayValue)) {
      return arrayValue.filter(Boolean).length
    }
  }

  return 0
}

const getAudioDurationMinutes = (audioDurationSeconds: unknown) => {
  const seconds = Number(audioDurationSeconds)
  if (!Number.isFinite(seconds) || seconds <= 0) return 60

  return Math.max(1, Math.round(seconds / 60))
}

const getTimelineHighlight = (timeline: unknown, fallbackDescription: string) => {
  const parsed = parseJsonField(timeline)
  const firstItem = Array.isArray(parsed) ? parsed[0] : null
  const title = typeof firstItem?.title === 'string' ? firstItem.title : ''

  return truncateText(title || fallbackDescription, 86)
}

const buildBookMetaTitle = (book: any) => {
  const suffix = ' | Summary & Audio'
  const mainLimit = 55 - suffix.length
  const title = book.title || 'Book Summary'
  const author = book.authors || ''

  if (!author) {
    return `${truncateText(title, mainLimit)}${suffix}`
  }

  const fullMain = `${title} by ${author}`.replace(/\s+/g, ' ').trim()
  if (fullMain.length <= mainLimit) {
    return `${fullMain}${suffix}`
  }

  const shortenedAuthor = truncateText(author, 14)
  const titleLimit = mainLimit - shortenedAuthor.length - ' by '.length

  if (titleLimit >= 12) {
    return `${truncateText(title, titleLimit)} by ${shortenedAuthor}${suffix}`
  }

  return `${truncateText(title, mainLimit)}${suffix}`
}

const buildBookMetaDescription = (book: any, fallbackDescription: string) => {
  const takeawayCount = getTakeawayCount(book.key_takeaways) || 8
  const durationMinutes = getAudioDurationMinutes(book.audio_duration)
  const highlight = getTimelineHighlight(book.timeline, fallbackDescription)
  const description = `Get ${takeawayCount} free key takeaways & Dive into the ${durationMinutes}-minute audio summary. ${highlight}`

  return truncateText(description, 160)
}


export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { id } = await params
  const path = `/book/${id}`

  // 直接使用 slug 查询（middleware 已处理旧 URL 重定向）
  const book = await getBookBySlug(id)

  // 🔒 CRITICAL SEO PROTECTION: Fallback strategy for draft/archived books
  // If book is not found OR not published, return noindex
  if (!book) {
    return mergeMetadata(path, {
      title: "Book Not Found | Nookix",
      description: "The requested book could not be found.",
      robots: {
        index: false,
        follow: true,
      },
    })
  }

  // 🔒 CRITICAL SEO PROTECTION: Prevent draft/archived books from being indexed
  // This is a FALLBACK strategy in case the database query filter fails
  // When status changes to 'published', this will automatically allow indexing
  if (book.status !== 'published') {
    console.warn(`⚠️ [SEO Protection] Book "${book.title}" (${book.slug}) is ${book.status}, blocking indexing`)
    return mergeMetadata(path, {
      title: `${book.title} | Nookix`,
      description: book.description || book.summary || '',
      robots: {
        index: false,  // 🔒 Block search engine indexing
        follow: true,  // Keep internal links crawlable to avoid mixed nofollow/dofollow signals
        googleBot: {
          index: false,
          follow: true,
        },
      },
    })
  }

  const description = book.description || book.summary || ''

  // 优先使用自定义 SEO 字段，否则使用书本核心卖点生成
  const metaTitle = book.seo_meta_title
    ? truncateText(book.seo_meta_title, 55)
    : buildBookMetaTitle(book)

  const metaDescription = book.seo_meta_description
    ? truncateText(book.seo_meta_description, 160)
    : buildBookMetaDescription(book, description)

  // 生成规范的纯 slug URL
  const canonicalSlug = book.slug
  const canonicalUrl = toSiteUrl(`/book/${canonicalSlug}`);

  // 获取书籍封面图片 URL - 优先使用书籍封面
  const ogImage = book.cover_image || toSiteUrl('/og-default.jpg')
  
  // 确保图片 URL 是完整的 HTTPS URL
  const fullOgImageUrl = ogImage.startsWith('http') ? ogImage : toSiteUrl(ogImage)

  return mergeMetadata(path, {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: 'Nookix',
      images: [
        {
          url: fullOgImageUrl,
          width: 1200,
          height: 630,
          alt: `${book.title} - Book Cover`,
        },
      ],
      locale: 'en_US',
      type: 'article',
      // 添加更多 OG 标签以提升社交媒体显示效果
      authors: book.authors ? [book.authors] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [fullOgImageUrl],
      creator: '@nookix',
      site: '@nookix',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  })
}

/**
 * 书本详情页
 * 
 * URL 格式：/book/{slug}（纯 slug，推荐格式）
 * 
 * 旧 URL 重定向：
 * - /book/{pb_id}-{slug} → 308 → /book/{slug}（由 middleware 处理）
 */
export default async function BookPage({ params }: BookPageProps) {
  const { id } = await params

  // 注意：410 Gone 已由 middleware 处理，不需要在这里检查
  // Middleware 会在请求到达这里之前拦截并返回 410 页面

  // 直接使用 slug 查询（middleware 已处理旧 URL 重定向）
  const book = await getBookBySlug(id)

  // 检查书籍是否存在且状态为 published
  if (!book || book.status !== 'published') {
    notFound()
  }

  // 5. 并行获取推荐数据
  const [sidebarDataRaw, relatedBooksRaw] = await Promise.all([
    getSidebarData(book),
    getRelatedBooks(book)
  ])

  // 6. 统一去重处理
  // 创建已使用的书本 ID 集合（包括当前书本）
  const usedBookIds = new Set<string>([book.id])
  
  // 6.1 处理 You May Also Like（优先级最高）
  const relatedBooks = relatedBooksRaw.filter(b => {
    if (usedBookIds.has(b.id)) return false
    usedBookIds.add(b.id)
    return true
  })
  
  // 6.2 处理 Popular Books（排除已使用的书本）
  const popularBooks = sidebarDataRaw.popularBooks.filter(b => {
    if (usedBookIds.has(b.id)) return false
    usedBookIds.add(b.id)
    return true
  })
  
  // 6.3 组合最终的 sidebarData
  const sidebarData = {
    popularBooks,
    genres: sidebarDataRaw.genres
  }
  
  console.log(`📊 [BookPage] 去重后: You May Also Like (${relatedBooks.length}), Popular Books (${popularBooks.length})`)

  // 获取主要分类用于面包屑
  const primaryGenre = book.genres?.[0];
  const primaryGenreName = primaryGenre?.name || 'Books';
  const primaryGenreSlug = primaryGenre?.slug || getSlugForGenre(primaryGenreName);

  // 生成简化的 Schema.org 结构（数组格式）
  const canonicalSlug = book.slug
  const schemaArray = generateBookSchema(book, canonicalSlug)

  return (
    <>
      {/* Schema.org 结构化数据 - 数组格式 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArray) }}
      />
      <div className="min-h-screen bg-[#FAFAF9]">
        {/* Hero-style background section for breadcrumb and book header */}
        <section className="relative overflow-x-hidden">
          {/* Decorative background glow - only blue orb */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {/* Large soft orb — shifted right by 400px total */}
            <div className="absolute -top-32 left-[368px] w-[640px] h-[640px] rounded-full bg-blue-100/40 blur-[120px]" />
          </div>

          {/* Breadcrumb navigation */}
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6 relative z-10">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap overflow-hidden">
              <a href="/" className="hover:text-blue-600 flex-shrink-0">Home</a>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <a href={`/genres/${primaryGenreSlug}`} className="hover:text-blue-600 flex-shrink-0">{primaryGenreName}</a>
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
              <span className="text-gray-900 overflow-hidden text-ellipsis">
                {book.title}
              </span>
            </nav>
          </div>

          {/* Book metadata section */}
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-1 sm:pt-4 pb-8 md:pb-12 relative z-10">
            <BookStaticContent book={book} />
          </div>
        </section>

        {/* Two-column layout: Left (Content) + Right (TOC) - Outside section for proper sticky */}
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 relative pb-10 md:pb-16">
          <div className="flex gap-8">
            {/* Left Column: Main Content */}
            <div className="flex-1 min-w-0">
              {/* Main content area with white background on desktop only */}
              <div className="px-0 md:px-6 lg:px-8 pt-0 md:pt-3 lg:pt-4 pb-0 md:pb-6 lg:pb-8 md:bg-white md:rounded-2xl md:shadow-sm -mt-2 relative z-10">
                <BookDetailContent
                  bookId={book.id}
                  initialBook={book}
                  initialChapters={[]} // TODO: 需要从 Supabase 获取 chapters
                  initialRelatedBooks={relatedBooks}
                  popularBooks={sidebarData.popularBooks}
                  genres={sidebarData.genres}
                />
              </div>
            </div>

            {/* Right Column: Table of Contents - Sticky */}
            <div className="hidden lg:block w-[240px] flex-shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto -mt-2">
                <div id="book-toc-portal"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width sections below main content */}
        <BookFooterSections />
      </div>
    </>
  )
}