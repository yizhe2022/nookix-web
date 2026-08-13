// 注意：这个文件中的函数主要用于服务器端（SSR、API Routes）
// 对于客户端组件，请直接使用 @/utils/supabase/client

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// 获取 Supabase 配置
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 创建一个简单的 Supabase 客户端（用于服务器端数据查询）
// 这个客户端不处理认证状态，只用于公开数据查询
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // 服务器端不需要持久化 session
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// ============================================================
// 🔒 CRITICAL: Book Status Filter
// ============================================================
// ALL book queries MUST filter out draft and archived books to prevent:
// 1. Unpublished books from appearing on the website
// 2. Google Search Console from indexing draft/archived books
// 3. Users from accessing incomplete content
//
// ALWAYS use: .eq('status', 'published')
// NEVER remove this filter unless you have a specific reason and understand the SEO implications
// ============================================================

/**
 * 🔒 CRITICAL: Helper function to ensure only published books are queried
 * This function adds the required status filter to any book query
 * 
 * @param query - Supabase query builder
 * @returns Query with status filter applied
 */
export function filterPublishedBooksOnly<T>(query: any): any {
  return query.eq('status', 'published')
}

// `book_transcript` 平均约 156 KB，`timeline` 也可能较大；它们不得随列表数据返回。
export const BOOK_CARD_FIELDS = 'id, slug, title, subtitle, authors, cover_image, rating, ratings_count, audio_duration, is_premium, one_liner, summary_audio, preview_audio_url, status, created_at'
export const BOOK_DETAIL_FIELDS = 'id, slug, title, subtitle, authors, cover_image, rating, ratings_count, audio_duration, audio_hosts, summary_audio, preview_audio_url, summary_preview, one_liner, target_audience, author_bio, seo_meta_title, seo_meta_description, is_premium, status, created_at, updated_at'
export const BOOK_TRANSCRIPT_FIELDS = 'book_transcript'

export async function getBookTranscriptById(bookId: string) {
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_TRANSCRIPT_FIELDS)
    .eq('id', bookId)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('❌ [Supabase] 获取 book_transcript 失败:', error)
    return null
  }

  return data?.book_transcript ?? null
}

export interface Genre {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  icon_emoji?: string
}

export interface CategoryGroup {
  category: string
  genres: Genre[]
}

/**
 * 从 Supabase 获取所有 genres 并按 category 分组
 * 用于 header 的 categories 下拉菜单
 */
export async function getCategoriesWithGenres(): Promise<CategoryGroup[]> {
  try {
    console.log('🔍 [Supabase] 开始获取 genres 数据...')
    console.log('🔍 [Supabase] URL:', SUPABASE_URL)
    console.log('🔍 [Supabase] Key exists:', !!SUPABASE_ANON_KEY)
    
    // 从 Supabase 获取所有 genres，按 category 和 name 排序
    const { data: genres, error } = await supabase
      .from('genres')
      .select('id, name, slug, category, description')
      .order('category')
      .order('name')
    
    if (error) {
      console.error('❌ [Supabase] 获取 genres 失败:', error)
      console.error('❌ [Supabase] Error details:', JSON.stringify(error, null, 2))
      throw error
    }
    
    if (!genres || genres.length === 0) {
      console.warn('⚠️ [Supabase] 没有找到 genres 数据')
      return []
    }
    
    console.log(`✅ [Supabase] 成功获取 ${genres.length} 个 genres`)
    console.log('✅ [Supabase] Sample genre:', genres[0])
    
    // 按 category 分组
    const grouped = genres.reduce((acc: Record<string, Genre[]>, genre) => {
      const category = genre.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(genre)
      return acc
    }, {})
    
    // 转换为 CategoryGroup 数组
    const categoryGroups: CategoryGroup[] = Object.entries(grouped).map(([category, genres]) => ({
      category: formatCategoryName(category),
      genres: genres
    }))
    
    // 按 category 名称排序
    categoryGroups.sort((a, b) => {
      const order = getCategoryOrder(a.category)
      const orderB = getCategoryOrder(b.category)
      return order - orderB
    })
    
    console.log('📊 [Supabase] 分组结果:', categoryGroups.map(g => ({
      category: g.category,
      count: g.genres.length
    })))
    
    return categoryGroups
  } catch (error) {
    console.error('❌ [Supabase] getCategoriesWithGenres 错误:', error)
    return []
  }
}

/**
 * 格式化 category 名称
 * 将数据库中的 snake_case 转换为显示用的 Title Case
 */
function formatCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'fiction_literature': 'Fiction & Literature',
    'health_lifestyle': 'Health & Lifestyle',
    'science_technology': 'Science & Technology',
    'wealth_investment': 'Wealth & Investment',
    'society_humanities': 'Society & Humanities',
    'personal_growth': 'Personal Growth',
    'career_business': 'Career & Business',
    'uncategorized': 'Other'
  }
  
  return categoryMap[category] || category
}

/**
 * 获取 category 的排序顺序
 * 新顺序：Personal Growth, Career & Business, Society & Humanities, Science & Technology,
 *         Health & Lifestyle, Wealth & Investment, Fiction & Literature
 */
function getCategoryOrder(category: string): number {
  const order: Record<string, number> = {
    'Personal Growth': 1,
    'Career & Business': 2,
    'Society & Humanities': 3,
    'Science & Technology': 4,
    'Health & Lifestyle': 5,
    'Wealth & Investment': 6,
    'Fiction & Literature': 7,
    'Other': 99
  }
  
  return order[category] || 50
}

/**
 * 根据 slug 获取单个 genre
 */
export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (error) {
      console.error('❌ [Supabase] 获取 genre 失败:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ [Supabase] getGenreBySlug 错误:', error)
    return null
  }
}

/**
 * 获取所有 genres（不分组）
 * 按创建时间排序，保持自然顺序
 */
export async function getAllGenres(): Promise<Genre[]> {
  try {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('created_at')
    
    if (error) {
      console.error('❌ [Supabase] 获取 genres 失败:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('❌ [Supabase] getAllGenres 错误:', error)
    return []
  }
}

/**
 * Collections 相关类型定义
 */
export interface Collection {
  id: string
  title: string
  slug: string
  description: string
  tagline: string
  sort_order: number
  is_enabled: boolean
  collection_cover_url: string
  featured_image_url: string
  seo_title: string
  seo_description: string
  created_at: string
  updated_at: string
}

export interface CollectionWithBooks extends Collection {
  books: {
    id: string
    title: string
    authors: string
    cover_image: string
    audio_duration: number
  }[]
  bookCount: number
}

/**
 * 获取所有已启用的 collections（用于首页展示）
 */
export async function getAllCollections(): Promise<Collection[]> {
  try {
    console.log('🔍 [Supabase] 获取所有 collections...')
    
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_enabled', true)
      .order('sort_order')
    
    if (error) {
      console.error('❌ [Supabase] 获取 collections 失败:', error)
      return []
    }
    
    console.log(`✅ [Supabase] 成功获取 ${data?.length || 0} 个 collections`)
    return data || []
  } catch (error) {
    console.error('❌ [Supabase] getAllCollections 错误:', error)
    return []
  }
}

/**
 * 获取 collection 及其关联的 books
 */
export async function getCollectionWithBooks(collectionId: string): Promise<CollectionWithBooks | null> {
  try {
    console.log(`🔍 [Supabase] 获取 collection: ${collectionId}`)
    
    // 1. 获取 collection 信息
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .eq('is_enabled', true)
      .single()
    
    if (collectionError || !collection) {
      console.error('❌ [Supabase] 获取 collection 失败:', collectionError)
      return null
    }
    
    // 2. 获取关联的 books（通过 collection_books 中间表）
    const { data: collectionBooks, error: booksError } = await supabase
      .from('collection_books')
      .select(`
        sort_order,
        books (
          id,
          title,
          authors,
          cover_image,
          audio_duration
        )
      `)
      .eq('collection_id', collectionId)
      .order('sort_order')
    
    if (booksError) {
      console.error('❌ [Supabase] 获取 collection books 失败:', booksError)
      return {
        ...collection,
        books: [],
        bookCount: 0
      }
    }
    
    // 3. 提取 books 数据
    const books = collectionBooks
      ?.map(cb => cb.books)
      .filter(Boolean)
      .flat() || []
    
    console.log(`✅ [Supabase] Collection "${collection.title}" 包含 ${books.length} 本书`)
    
    return {
      ...collection,
      books: books as any[],
      bookCount: books.length
    }
  } catch (error) {
    console.error('❌ [Supabase] getCollectionWithBooks 错误:', error)
    return null
  }
}

/**
 * 获取所有 collections 及其书籍数量（用于列表页）
 */
export async function getAllCollectionsWithBookCount(): Promise<CollectionWithBooks[]> {
  try {
    console.log('🔍 [Supabase] 获取所有 collections 及书籍数量...')
    
    // 1. 获取所有 collections
    const collections = await getAllCollections()
    
    if (!collections || collections.length === 0) {
      return []
    }
    
    // 2. 为每个 collection 获取完整的书籍信息（用于统计数量和时长）
    const collectionsWithBooks = await Promise.all(
      collections.map(async (collection) => {
        // 第一步：获取该 collection 的所有 book_id
        const { data: collectionBookIds, error: idsError } = await supabase
          .from('collection_books')
          .select('book_id, sort_order')
          .eq('collection_id', collection.id)
          .order('sort_order')
        
        if (idsError || !collectionBookIds || collectionBookIds.length === 0) {
          console.error(`❌ [Supabase] 获取 collection "${collection.title}" 的书籍 ID 失败:`, idsError)
          return {
            ...collection,
            books: [],
            bookCount: 0,
            allBooks: []
          }
        }
        
        // 第二步：根据 book_id 批量获取书籍详情
        const bookIds = collectionBookIds.map(cb => cb.book_id)
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id, title, slug, authors, cover_image, audio_duration')
          .in('id', bookIds)
          .eq('status', 'published')  // 只获取已发布的书籍
        
        if (booksError || !booksData) {
          console.error(`❌ [Supabase] 获取 collection "${collection.title}" 的书籍详情失败:`, booksError)
          return {
            ...collection,
            books: [],
            bookCount: 0,
            allBooks: []
          }
        }
        
        // 第三步：按照 sort_order 排序书籍
        const bookIdToBook = new Map(booksData.map(book => [book.id, book]))
        const sortedBooks = collectionBookIds
          .map(cb => bookIdToBook.get(cb.book_id))
          .filter(Boolean) as any[]
        
        // 只保留前3本用于预览
        const previewBooks = sortedBooks.slice(0, 3)
        
        console.log(`✅ [Supabase] Collection "${collection.title}": ${sortedBooks.length} 本书`)
        
        return {
          ...collection,
          books: previewBooks, // 只返回前3本用于预览
          bookCount: sortedBooks.length, // 但 bookCount 是总数
          allBooks: sortedBooks // 保存所有书籍用于计算总时长
        }
      })
    )
    
    console.log(`✅ [Supabase] 成功获取 ${collectionsWithBooks.length} 个 collections`)
    return collectionsWithBooks
  } catch (error) {
    console.error('❌ [Supabase] getAllCollectionsWithBookCount 错误:', error)
    return []
  }
}


/**
 * 根据 slug 获取单个 collection 及其所有书籍（用于详情页）
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionWithBooks | null> {
  try {
    console.log(`🔍 [Supabase] 根据 slug 获取 collection: ${slug}`)
    
    // 1. 根据 slug 获取 collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_enabled', true)
      .single()
    
    if (collectionError || !collection) {
      console.error('❌ [Supabase] 获取 collection 失败:', collectionError)
      console.error('❌ [Supabase] Error details:', JSON.stringify(collectionError, null, 2))
      return null
    }
    
    console.log(`✅ [Supabase] 找到 collection:`, {
      id: collection.id,
      title: collection.title,
      slug: collection.slug
    })
    
    // 2. 获取该 collection 的所有 book_id
    const { data: collectionBookIds, error: idsError } = await supabase
      .from('collection_books')
      .select('book_id, sort_order')
      .eq('collection_id', collection.id)
      .order('sort_order')
    
    console.log(`📚 [Supabase] collection_books 查询结果:`, {
      count: collectionBookIds?.length || 0,
      error: idsError,
      sample: collectionBookIds?.[0]
    })
    
    if (idsError) {
      console.error(`❌ [Supabase] 获取 collection 书籍 ID 失败:`, idsError)
      console.error('❌ [Supabase] Error details:', JSON.stringify(idsError, null, 2))
      return {
        ...collection,
        books: [],
        bookCount: 0
      }
    }
    
    if (!collectionBookIds || collectionBookIds.length === 0) {
      console.warn(`⚠️ [Supabase] Collection "${collection.title}" 没有关联的书籍`)
      return {
        ...collection,
        books: [],
        bookCount: 0
      }
    }
    
    // 3. 根据 book_id 批量获取书籍详情
    const bookIds = collectionBookIds.map(cb => cb.book_id)
    console.log(`📖 [Supabase] 准备获取 ${bookIds.length} 本书的详情`)
    
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, slug, authors, cover_image, audio_duration, one_liner, is_premium, ratings_count, summary_audio')
      .in('id', bookIds)
      .eq('status', 'published')  // 只获取已发布的书籍
    
    console.log(`📖 [Supabase] books 查询结果:`, {
      count: booksData?.length || 0,
      error: booksError,
      sample: booksData?.[0] ? {
        id: booksData[0].id,
        title: booksData[0].title
      } : null
    })
    
    if (booksError) {
      console.error(`❌ [Supabase] 获取书籍详情失败:`, booksError)
      console.error('❌ [Supabase] Error details:', JSON.stringify(booksError, null, 2))
      return {
        ...collection,
        books: [],
        bookCount: 0
      }
    }
    
    if (!booksData || booksData.length === 0) {
      console.warn(`⚠️ [Supabase] 没有找到任何书籍数据`)
      return {
        ...collection,
        books: [],
        bookCount: 0
      }
    }
    
    // 4. 按照 sort_order 排序书籍
    const bookIdToBook = new Map(booksData.map(book => [book.id, book]))
    const sortedBooks = collectionBookIds
      .map(cb => bookIdToBook.get(cb.book_id))
      .filter(Boolean) as any[]
    
    console.log(`✅ [Supabase] Collection "${collection.title}" 包含 ${sortedBooks.length} 本书`)
    
    return {
      ...collection,
      books: sortedBooks,
      bookCount: sortedBooks.length
    }
  } catch (error) {
    console.error('❌ [Supabase] getCollectionBySlug 错误:', error)
    return null
  }
}

/**
 * 根据 slug 获取单个 genre 及其所有书籍（用于 genre 详情页）
 * 
 * 🔒 CRITICAL SEO PROTECTION: This function MUST filter draft/archived books
 * Status filter: .eq('status', 'published')
 * DO NOT REMOVE - Prevents unpublished books from appearing on genre pages
 */
export async function getGenreWithBooks(slug: string): Promise<{
  genre: Genre
  books: any[]
} | null> {
  try {
    console.log(`🔍 [Supabase] 根据 slug 获取 genre: ${slug}`)
    
    // 1. 根据 slug 获取 genre
    const { data: genre, error: genreError } = await supabase
      .from('genres')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (genreError || !genre) {
      console.error('❌ [Supabase] 获取 genre 失败:', genreError)
      return null
    }
    
    console.log(`✅ [Supabase] 找到 genre:`, {
      id: genre.id,
      name: genre.name,
      slug: genre.slug
    })
    
    // 2. 获取该 genre 的所有 book_id（通过 book_genres 中间表）
    const { data: bookGenres, error: bookGenresError } = await supabase
      .from('book_genres')
      .select('book_id')
      .eq('genre_id', genre.id)
    
    console.log(`📚 [Supabase] book_genres 查询结果:`, {
      count: bookGenres?.length || 0,
      error: bookGenresError
    })
    
    if (bookGenresError) {
      console.error(`❌ [Supabase] 获取 genre 书籍 ID 失败:`, bookGenresError)
      return {
        genre,
        books: []
      }
    }
    
    if (!bookGenres || bookGenres.length === 0) {
      console.warn(`⚠️ [Supabase] Genre "${genre.name}" 没有关联的书籍`)
      return {
        genre,
        books: []
      }
    }
    
    // 🔒 CRITICAL: Must filter by status='published' to prevent draft/archived books from showing
    // 3. 根据 book_id 批量获取书籍详情
    const bookIds = bookGenres.map(bg => bg.book_id)
    console.log(`📖 [Supabase] 准备获取 ${bookIds.length} 本书的详情`)
    
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, slug, authors, cover_image, audio_duration, one_liner, is_premium, ratings_count')
      .in('id', bookIds)
      .eq('status', 'published')  // 🔒 CRITICAL: DO NOT REMOVE - SEO Protection
      .order('created_at', { ascending: false })
    
    console.log(`📖 [Supabase] books 查询结果:`, {
      count: booksData?.length || 0,
      error: booksError
    })
    
    if (booksError) {
      console.error(`❌ [Supabase] 获取书籍详情失败:`, booksError)
      return {
        genre,
        books: []
      }
    }
    
    console.log(`✅ [Supabase] Genre "${genre.name}" 包含 ${booksData?.length || 0} 本书`)
    
    return {
      genre,
      books: booksData || []
    }
  } catch (error) {
    console.error('❌ [Supabase] getGenreWithBooks 错误:', error)
    return null
  }
}

// ============================================================
// Blogs 相关函数
// ============================================================

export interface Blog {
  id: string
  name: string
  slug: string
  seo_title?: string
  seo_description?: string
  cover_image?: string
  content?: string
  published_date?: string
  status: 'draft' | 'published' | 'archived'
  tags?: string[]
  created_at?: string
  updated_at?: string
}

/**
 * 获取所有已发布的 blogs（分页）
 */
export async function getAllBlogs(page: number = 1, perPage: number = 20, tag?: string) {
  try {
    console.log(`📚 [Supabase] 获取 blogs (page: ${page}, perPage: ${perPage}, tag: ${tag || 'all'})...`)
    
    const offset = (page - 1) * perPage
    
    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_date', { ascending: false })
      .range(offset, offset + perPage - 1)
    
    // 如果有 tag 筛选
    if (tag) {
      query = query.contains('tags', [tag])
    }
    
    const { data: blogs, error, count } = await query
    
    if (error) {
      console.error('❌ [Supabase] 获取 blogs 失败:', error)
      throw error
    }
    
    const totalPages = count ? Math.ceil(count / perPage) : 1
    
    console.log(`✅ [Supabase] 成功获取 ${blogs?.length || 0} 篇 blogs (总计: ${count})`)
    
    return {
      blogs: blogs || [],
      totalPages,
      totalCount: count || 0
    }
  } catch (error) {
    console.error('❌ [Supabase] getAllBlogs 错误:', error)
    return {
      blogs: [],
      totalPages: 1,
      totalCount: 0
    }
  }
}

/**
 * 根据 slug 获取单个 blog
 */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    console.log(`📝 [Supabase] 获取 blog by slug: ${slug}...`)
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    
    if (error) {
      console.error('❌ [Supabase] 获取 blog 失败:', error)
      return null
    }
    
    if (!blog) {
      console.warn(`⚠️ [Supabase] 未找到 slug 为 "${slug}" 的 blog`)
      return null
    }
    
    console.log(`✅ [Supabase] 成功获取 blog: ${blog?.name}`)
    
    return blog
  } catch (error) {
    console.error('❌ [Supabase] getBlogBySlug 错误:', error)
    return null
  }
}

/**
 * 根据 ID 获取单个 blog
 */
export async function getBlogById(id: string): Promise<Blog | null> {
  try {
    console.log(`📝 [Supabase] 获取 blog by id: ${id}...`)
    
    const { data: blog, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .maybeSingle()
    
    if (error) {
      console.error('❌ [Supabase] 获取 blog 失败:', error)
      return null
    }
    
    if (!blog) {
      console.warn(`⚠️ [Supabase] 未找到 ID 为 "${id}" 的 blog`)
      return null
    }
    
    console.log(`✅ [Supabase] 成功获取 blog: ${blog?.name}`)
    
    return blog
  } catch (error) {
    console.error('❌ [Supabase] getBlogById 错误:', error)
    return null
  }
}

/**
 * 获取所有可用的 blog tags
 */
export async function getAllBlogTags(): Promise<string[]> {
  try {
    console.log('🏷️ [Supabase] 获取所有 blog tags...')
    
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('tags')
      .eq('status', 'published')
    
    if (error) {
      console.error('❌ [Supabase] 获取 tags 失败:', error)
      return []
    }
    
    // 收集所有 tags 并去重
    const allTags = new Set<string>()
    blogs?.forEach(blog => {
      blog.tags?.forEach((tag: string) => allTags.add(tag))
    })
    
    const tags = Array.from(allTags).sort()
    
    console.log(`✅ [Supabase] 成功获取 ${tags.length} 个 tags`)
    
    return tags
  } catch (error) {
    console.error('❌ [Supabase] getAllBlogTags 错误:', error)
    return []
  }
}

/**
 * 获取推荐的 blogs（基于 tags）
 */
export async function getRecommendedBlogs(tags: string[], currentBlogId: string, limit: number = 5) {
  try {
    console.log(`🔍 [Supabase] 获取推荐 blogs (tags: ${tags.join(', ')}, limit: ${limit})...`)
    
    // 获取包含相同 tags 的其他 blogs
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, name, slug, cover_image, published_date, tags')
      .eq('status', 'published')
      .neq('id', currentBlogId)
      .order('published_date', { ascending: false })
      .limit(50) // 先获取更多，然后在客户端筛选
    
    if (error) {
      console.error('❌ [Supabase] 获取推荐 blogs 失败:', error)
      return []
    }
    
    // 计算每个 blog 与当前 blog 的 tag 匹配度
    const blogsWithScore = blogs?.map(blog => {
      const matchingTags = blog.tags?.filter((tag: string) => tags.includes(tag)) || []
      return {
        ...blog,
        matchScore: matchingTags.length
      }
    }) || []
    
    // 按匹配度排序，然后取前 N 个
    const recommended = blogsWithScore
      .filter(blog => blog.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(blog => ({
        id: blog.id,
        title: blog.name,
        slug: blog.slug,
        image: blog.cover_image || '/placeholder.svg',
        publishDate: blog.published_date
      }))
    
    console.log(`✅ [Supabase] 成功获取 ${recommended.length} 个推荐 blogs`)
    
    return recommended
  } catch (error) {
    console.error('❌ [Supabase] getRecommendedBlogs 错误:', error)
    return []
  }
}

/**
 * 获取相邻的 blogs（上一篇和下一篇）
 */
export async function getAdjacentBlogs(currentBlogId: string) {
  try {
    console.log(`🔍 [Supabase] 获取相邻 blogs for: ${currentBlogId}...`)
    
    // 先获取当前 blog 的发布时间
    const { data: currentBlog, error: currentError } = await supabase
      .from('blogs')
      .select('published_date, created_at')
      .eq('id', currentBlogId)
      .single()
    
    if (currentError || !currentBlog) {
      console.error('❌ [Supabase] 获取当前 blog 失败:', currentError)
      return { previous: null, next: null }
    }
    
    const currentDate = currentBlog.published_date || currentBlog.created_at
    
    // 获取上一篇（发布时间晚于当前的最早一篇）
    const { data: previousBlogs, error: prevError } = await supabase
      .from('blogs')
      .select('id, name, slug, cover_image')
      .eq('status', 'published')
      .gt('published_date', currentDate)
      .order('published_date', { ascending: true })
      .limit(1)
    
    // 获取下一篇（发布时间早于当前的最新一篇）
    const { data: nextBlogs, error: nextError } = await supabase
      .from('blogs')
      .select('id, name, slug, cover_image')
      .eq('status', 'published')
      .lt('published_date', currentDate)
      .order('published_date', { ascending: false })
      .limit(1)
    
    const previous = previousBlogs && previousBlogs.length > 0 ? previousBlogs[0] : null
    const next = nextBlogs && nextBlogs.length > 0 ? nextBlogs[0] : null
    
    console.log(`✅ [Supabase] 相邻 blogs: previous=${previous?.name || 'none'}, next=${next?.name || 'none'}`)
    
    return { previous, next }
  } catch (error) {
    console.error('❌ [Supabase] getAdjacentBlogs 错误:', error)
    return { previous: null, next: null }
  }
}

/**
 * 获取特定场景的精选书籍
 * @param usageScenario - 使用场景：'web_home_showcase' | 'app_trending_searches' | 'web_trending_searches'
 */
export async function getScenarioSelectedBooks(usageScenario: 'web_home_showcase' | 'app_trending_searches' | 'web_trending_searches') {
  try {
    console.log(`🔍 [Supabase] 获取 scenario_selected books (scenario: ${usageScenario})...`)
    
    // 1. 获取 scenario_selected 记录
    const { data: scenarios, error: scenarioError } = await supabase
      .from('scenario_selected')
      .select('id, title, usage_scenario, description')
      .eq('usage_scenario', usageScenario)
      .limit(1)
    
    if (scenarioError) {
      console.error('❌ [Supabase] 获取 scenario_selected 失败:', scenarioError)
      return null
    }
    
    if (!scenarios || scenarios.length === 0) {
      console.warn(`⚠️ [Supabase] 没有找到 usage_scenario = ${usageScenario} 的数据`)
      return null
    }
    
    const scenario = scenarios[0]
    console.log(`✅ [Supabase] 找到 scenario: ${scenario.title}`)
    
    // 2. 获取关联的书籍（通过中间表）
    const { data: bookRelations, error: relationsError } = await supabase
      .from('scenario_selected_books')
      .select('book_id, sort_order')
      .eq('scenario_selected_id', scenario.id)
      .order('sort_order', { ascending: true })
    
    if (relationsError) {
      console.error('❌ [Supabase] 获取书籍关联失败:', relationsError)
      return null
    }
    
    if (!bookRelations || bookRelations.length === 0) {
      console.warn(`⚠️ [Supabase] scenario ${scenario.title} 没有关联的书籍`)
      return {
        scenario,
        books: []
      }
    }
    
    console.log(`✅ [Supabase] 找到 ${bookRelations.length} 个书籍关联`)
    
    // 3. 获取书籍详情
    const bookIds = bookRelations.map(rel => rel.book_id)
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, slug, authors, cover_image, audio_duration, status')
      .in('id', bookIds)
      .eq('status', 'published')
    
    if (booksError) {
      console.error('❌ [Supabase] 获取书籍详情失败:', booksError)
      return null
    }
    
    if (!books || books.length === 0) {
      console.warn(`⚠️ [Supabase] 没有找到已发布的书籍`)
      return {
        scenario,
        books: []
      }
    }
    
    // 4. 按 sort_order 排序书籍
    const sortedBooks = bookRelations
      .map(rel => {
        const book = books.find(b => b.id === rel.book_id)
        return book ? { ...book, sort_order: rel.sort_order } : null
      })
      .filter(book => book !== null)
    
    console.log(`✅ [Supabase] 成功获取 ${sortedBooks.length} 本书籍`)
    
    return {
      scenario,
      books: sortedBooks
    }
  } catch (error) {
    console.error('❌ [Supabase] getScenarioSelectedBooks 错误:', error)
    return null
  }
}

/**
 * 获取 Web 首页精选书籍
 */
export async function getWebHomeFeaturedBooks() {
  return getScenarioSelectedBooks('web_home_showcase')
}

/**
 * 通过 slug 获取书本
 * @param slug - 书本 slug
 */
export const getBookBySlug = cache(async (slug: string) => {
  try {
    console.log(`🔍 [Supabase] 通过 slug 获取书本: ${slug}`)
    
    // 1. 获取书本基本信息
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(BOOK_DETAIL_FIELDS)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    
    if (bookError) {
      console.error('❌ [Supabase] 通过 slug 获取书本失败:', bookError)
      return null
    }
    
    if (!book) {
      console.warn(`⚠️ [Supabase] 未找到 slug 为 "${slug}" 的书本`)
      return null
    }
    
    console.log(`✅ [Supabase] 找到书本: ${book.title}`)
    
    // 2. 获取书本的 genres（通过 book_genres 中间表）
    const { data: bookGenres, error: genresError } = await supabase
      .from('book_genres')
      .select(`
        genre_id,
        sort_order,
        genres (
          id,
          name,
          slug,
          category
        )
      `)
      .eq('book_id', book.id)
      .order('sort_order', { ascending: true })  // 按 sort_order 排序
    
    if (genresError) {
      console.error('❌ [Supabase] 获取 genres 失败:', genresError)
    }
    
    // 3. 组合数据，将 sort_order 添加到 genre 对象中
    const genres = bookGenres?.map(bg => ({
      ...bg.genres,
      sort_order: bg.sort_order
    })).filter(Boolean) || []
    
    console.log(`✅ [Supabase] 书本有 ${genres.length} 个 genres`)
    
    return {
      ...(book as any),
      genres: genres as any
    }
  } catch (error) {
    console.error('❌ [Supabase] getBookBySlug 错误:', error)
    return null
  }
})

/**
 * 通过 PocketBase ID 获取书本
 * @param pbId - PocketBase ID
 */
export async function getBookByPbId(pbId: string) {
  try {
    console.log(`🔍 [Supabase] 通过 pb_id 获取书本: ${pbId}`)
    
    // 1. 获取书本基本信息
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(BOOK_DETAIL_FIELDS)
      .eq('pb_id', pbId)
      .eq('status', 'published')
      .maybeSingle()
    
    if (bookError) {
      console.error('❌ [Supabase] 通过 pb_id 获取书本失败:', bookError)
      return null
    }
    
    if (!book) {
      console.warn(`⚠️ [Supabase] 未找到 pb_id 为 "${pbId}" 的书本`)
      return null
    }
    
    console.log(`✅ [Supabase] 找到书本: ${book.title} (slug: ${book.slug})`)
    
    // 2. 获取书本的 genres（通过 book_genres 中间表）
    const { data: bookGenres, error: genresError } = await supabase
      .from('book_genres')
      .select(`
        genre_id,
        sort_order,
        genres (
          id,
          name,
          slug,
          category
        )
      `)
      .eq('book_id', book.id)
      .order('sort_order', { ascending: true })  // 按 sort_order 排序
    
    if (genresError) {
      console.error('❌ [Supabase] 获取 genres 失败:', genresError)
    }
    
    // 3. 组合数据，将 sort_order 添加到 genre 对象中
    const genres = bookGenres?.map(bg => ({
      ...bg.genres,
      sort_order: bg.sort_order
    })).filter(Boolean) || []
    
    return {
      ...(book as any),
      genres: genres as any
    }
  } catch (error) {
    console.error('❌ [Supabase] getBookByPbId 错误:', error)
    return null
  }
}

/**
 * 获取书本详情（包括 genres）
 * @param bookId - 书本 ID
 */
export async function getBookById(bookId: string) {
  try {
    console.log(`🔍 [Supabase] 获取书本详情: ${bookId}`)
    
    // 1. 获取书本基本信息
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(BOOK_DETAIL_FIELDS)
      .eq('id', bookId)
      .eq('status', 'published')
      .maybeSingle()
    
    if (bookError) {
      console.error('❌ [Supabase] 获取书本失败:', bookError)
      return null
    }
    
    if (!book) {
      console.warn(`⚠️ [Supabase] 未找到 ID 为 "${bookId}" 的书本`)
      return null
    }
    
    console.log(`✅ [Supabase] 找到书本: ${book.title}`)
    
    // 2. 获取书本的 genres（通过 book_genres 中间表）
    const { data: bookGenres, error: genresError } = await supabase
      .from('book_genres')
      .select(`
        genre_id,
        sort_order,
        genres (
          id,
          name,
          slug,
          category
        )
      `)
      .eq('book_id', bookId)
      .order('sort_order', { ascending: true })  // 按 sort_order 排序
    
    if (genresError) {
      console.error('❌ [Supabase] 获取 genres 失败:', genresError)
    }
    
    // 3. 组合数据，将 sort_order 添加到 genre 对象中
    const genres = bookGenres?.map(bg => ({
      ...bg.genres,
      sort_order: bg.sort_order
    })).filter(Boolean) || []
    
    console.log(`✅ [Supabase] 书本有 ${genres.length} 个 genres`)
    
    return {
      ...(book as any),
      genres: genres as any
    }
  } catch (error) {
    console.error('❌ [Supabase] getBookById 错误:', error)
    return null
  }
}

/**
 * 获取相关书籍（基于主 genre）
 * @param bookId - 当前书本 ID
 * @param primaryGenreId - 主 genre ID（sort_order = 0）
 * @param limit - 返回数量
 * 
 * 🔒 CRITICAL SEO PROTECTION: This function MUST filter draft/archived books
 * Status filter: .eq('books.status', 'published')
 * DO NOT REMOVE - Prevents unpublished books from appearing in "You May Also Like"
 */
export async function getRelatedBooksByPrimaryGenre(bookId: string, primaryGenreId: string, limit: number = 10) {
  try {
    console.log(`🔍 [Supabase] 获取相关书籍 (primary genre: ${primaryGenreId})`)
    
    if (!primaryGenreId) {
      console.warn('⚠️ [Supabase] 没有提供 primary genre ID')
      return []
    }
    
    // 🔒 CRITICAL: Must filter by status='published' to prevent draft/archived books from showing
    // 获取有相同主 genre 的高评分书籍
    const { data: relatedBookGenres, error } = await supabase
      .from('book_genres')
      .select(`
        book_id,
        books!inner (
          id,
          slug,
          title,
          authors,
          cover_image,
          audio_duration,
          rating,
          status
        )
      `)
      .eq('genre_id', primaryGenreId)
      .neq('book_id', bookId)
      .eq('books.status', 'published')  // 🔒 CRITICAL: DO NOT REMOVE - SEO Protection
      .gt('books.rating', 4.0)
      .limit(limit * 3) // 多获取一些用于随机选择
    
    if (error) {
      console.error('❌ [Supabase] 获取相关书籍失败:', error)
      return []
    }
    
    // 去重（一本书可能有多个 genres）
    const seen = new Set<string>()
    const uniqueBooks: any[] = []
    
    for (const item of relatedBookGenres || []) {
      const book = Array.isArray(item.books) ? item.books[0] : item.books
      if (book && !seen.has(book.id)) {
        seen.add(book.id)
        uniqueBooks.push(book)
      }
    }
    
    // 随机打乱并取前 N 本
    const shuffled = uniqueBooks.sort(() => Math.random() - 0.5)
    const result = shuffled.slice(0, limit)
    
    console.log(`✅ [Supabase] 找到 ${result.length} 本相关书籍 (rating > 4.0)`)
    
    return result
  } catch (error) {
    console.error('❌ [Supabase] getRelatedBooksByPrimaryGenre 错误:', error)
    return []
  }
}

/**
 * 获取热门书籍（高评分 + 高评论数）
 * @param limit - 返回数量
 * 
 * 🔒 CRITICAL SEO PROTECTION: This function MUST filter draft/archived books
 * Status filter: .eq('status', 'published')
 * DO NOT REMOVE - Prevents unpublished books from appearing in "Popular Books"
 */
export async function getPopularBooks(limit: number = 10) {
  try {
    console.log(`🔍 [Supabase] 获取热门书籍 (limit: ${limit})`)
    
    // 🔒 CRITICAL: Must filter by status='published' to prevent draft/archived books from showing
    // 查询高评分且高评论数的书籍
    const { data: books, error } = await supabase
      .from('books')
      .select('id, slug, title, authors, cover_image, audio_duration, rating, ratings_count')
      .eq('status', 'published')  // 🔒 CRITICAL: DO NOT REMOVE - SEO Protection
      .gte('rating', 4.0)
      .gt('ratings_count', 50000)
      .limit(limit * 3) // 多获取一些用于随机选择
    
    if (error) {
      console.error('❌ [Supabase] 获取热门书籍失败:', error)
      return []
    }
    
    if (!books || books.length === 0) {
      console.warn('⚠️ [Supabase] 没有找到符合条件的热门书籍 (rating >= 4.0, ratings_count > 50000)')
      console.log('💡 [Supabase] 尝试降低标准：rating >= 4.0, ratings_count > 10000')
      
      // 🔒 CRITICAL: Fallback query also must filter by status='published'
      // 降低标准重试
      const { data: fallbackBooks, error: fallbackError } = await supabase
        .from('books')
        .select('id, slug, title, authors, cover_image, audio_duration, rating, ratings_count')
        .eq('status', 'published')  // 🔒 CRITICAL: DO NOT REMOVE - SEO Protection
        .gte('rating', 4.0)
        .gt('ratings_count', 10000)
        .limit(limit * 3)
      
      if (fallbackError || !fallbackBooks || fallbackBooks.length === 0) {
        console.error('❌ [Supabase] 降低标准后仍然没有找到热门书籍')
        return []
      }
      
      const shuffled = fallbackBooks.sort(() => Math.random() - 0.5)
      const result = shuffled.slice(0, limit)
      console.log(`✅ [Supabase] 找到 ${result.length} 本热门书籍 (降低标准)`)
      return result
    }
    
    // 随机打乱
    const shuffled = books.sort(() => Math.random() - 0.5)
    const result = shuffled.slice(0, limit)
    
    console.log(`✅ [Supabase] 找到 ${result.length} 本热门书籍 (rating >= 4.0, ratings_count > 50000)`)
    
    return result
  } catch (error) {
    console.error('❌ [Supabase] getPopularBooks 错误:', error)
    return []
  }
}

// ============================================================
// 分页查询函数（用于无限滚动）
// ============================================================

/**
 * 获取 genre 的书籍（分页版本）- 用于无限滚动
 * @param slug - genre slug
 * @param page - 页码（从 1 开始）
 * @param perPage - 每页数量
 */
export async function getGenreWithBooksPaginated(
  slug: string,
  page: number = 1,
  perPage: number = 24
) {
  try {
    console.log(`🔍 [Supabase] 获取 genre 书籍 (分页): slug=${slug}, page=${page}, perPage=${perPage}`)
    
    // 1. 获取 genre
    const { data: genre, error: genreError } = await supabase
      .from('genres')
      .select('*')
      .eq('slug', slug)
      .single()
    
    if (genreError || !genre) {
      console.error('❌ [Supabase] 获取 genre 失败:', genreError)
      return null
    }
    
    // 2. 统计该 genre 下所有 published 书籍总数
    // 使用 JOIN 方式统计，避免子查询
    const { count: totalCount } = await supabase
      .from('books')
      .select('id, book_genres!inner(genre_id)', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('book_genres.genre_id', genre.id)
    
    const totalBooks = totalCount || 0
    
    // 3. 直接从 books 表查询，通过 book_genres 关系 JOIN 过滤
    //    先过滤 status + genre，再排序分页
    const offset = (page - 1) * perPage
    const { data: booksData, error: booksError } = await supabase
      .from('books')
      .select('id, title, slug, authors, cover_image, audio_duration, one_liner, is_premium, ratings_count, book_genres!inner(genre_id)')
      .eq('status', 'published')
      .eq('book_genres.genre_id', genre.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)
    
    if (booksError) {
      console.error('❌ [Supabase] 获取书籍失败:', booksError)
      return {
        genre,
        books: [],
        totalBooks,
        totalPages: Math.ceil(totalBooks / perPage),
        currentPage: page,
        hasMore: false
      }
    }
    
    // 移除 JOIN 字段，只保留书籍数据
    const books = (booksData || []).map(({ book_genres, ...book }) => book)
    
    const totalPages = Math.ceil(totalBooks / perPage)
    const hasMore = page < totalPages
    
    console.log(`✅ [Supabase] Genre "${genre.name}" 第 ${page} 页: ${books.length} 本书 (总计: ${totalBooks}, 还有更多: ${hasMore})`)
    
    return {
      genre,
      books,
      totalBooks,
      totalPages,
      currentPage: page,
      hasMore
    }
  } catch (error) {
    console.error('❌ [Supabase] getGenreWithBooksPaginated 错误:', error)
    return null
  }
}

/**
 * 获取所有 collections（分页版本，优化查询）- 用于无限滚动
 * @param page - 页码（从 1 开始）
 * @param perPage - 每页数量
 */
export async function getAllCollectionsPaginated(
  page: number = 1,
  perPage: number = 15
) {
  try {
    console.log(`🔍 [Supabase] 获取 collections (分页): page=${page}, perPage=${perPage}`)
    
    const offset = (page - 1) * perPage
    
    // 1. 分页获取 collections（带总数）
    const { data: collections, error, count } = await supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .eq('is_enabled', true)
      .order('sort_order')
      .range(offset, offset + perPage - 1)
    
    if (error) {
      console.error('❌ [Supabase] 获取 collections 失败:', error)
      return { 
        collections: [], 
        totalPages: 1, 
        totalCount: 0,
        currentPage: page,
        hasMore: false
      }
    }
    
    if (!collections || collections.length === 0) {
      console.log(`⚠️ [Supabase] 第 ${page} 页没有 collections`)
      return { 
        collections: [], 
        totalPages: Math.ceil((count || 0) / perPage), 
        totalCount: count || 0,
        currentPage: page,
        hasMore: false
      }
    }
    
    // 2. 批量获取所有 collection 的书籍数量（一次查询，避免 N+1）
    const collectionIds = collections.map(c => c.id)
    const { data: bookCounts } = await supabase
      .from('collection_books')
      .select('collection_id, book_id')
      .in('collection_id', collectionIds)
    
    // 3. 统计每个 collection 的书籍数量
    const countMap = new Map<string, number>()
    bookCounts?.forEach(cb => {
      countMap.set(cb.collection_id, (countMap.get(cb.collection_id) || 0) + 1)
    })
    
    // 4. 为每个 collection 获取前 3 本书的封面（用于预览）
    const collectionsWithBooks = await Promise.all(
      collections.map(async (collection) => {
        // 获取该 collection 的前 3 本书的 book_id
        const { data: previewBookIds } = await supabase
          .from('collection_books')
          .select('book_id, sort_order')
          .eq('collection_id', collection.id)
          .order('sort_order')
          .limit(3)
        
        if (!previewBookIds || previewBookIds.length === 0) {
          return {
            ...collection,
            bookCount: 0,
            books: []
          }
        }
        
        // 批量获取书籍详情
        const bookIds = previewBookIds.map(pb => pb.book_id)
        const { data: booksData } = await supabase
          .from('books')
          .select('id, title, cover_image, audio_duration')
          .in('id', bookIds)
          .eq('status', 'published')
        
        if (!booksData) {
          return {
            ...collection,
            bookCount: countMap.get(collection.id) || 0,
            books: []
          }
        }
        
        // 按 sort_order 排序
        const bookIdToBook = new Map(booksData.map(book => [book.id, book]))
        const sortedBooks = previewBookIds
          .map(pb => bookIdToBook.get(pb.book_id))
          .filter(Boolean)
        
        return {
          ...collection,
          bookCount: countMap.get(collection.id) || 0,
          books: sortedBooks
        }
      })
    )
    
    // 5. 获取所有书籍用于计算总时长
    const collectionsWithDuration = await Promise.all(
      collectionsWithBooks.map(async (collection) => {
        // 获取该 collection 的所有书籍 ID
        const { data: allBookIds } = await supabase
          .from('collection_books')
          .select('book_id')
          .eq('collection_id', collection.id)
        
        if (!allBookIds || allBookIds.length === 0) {
          return collection
        }
        
        // 批量获取所有书籍的时长
        const bookIds = allBookIds.map(b => b.book_id)
        const { data: allBooksData } = await supabase
          .from('books')
          .select('id, audio_duration')
          .in('id', bookIds)
          .eq('status', 'published')
        
        return {
          ...collection,
          allBooks: allBooksData || []
        }
      })
    )
    
    const totalPages = Math.ceil((count || 0) / perPage)
    const hasMore = page < totalPages
    
    console.log(`✅ [Supabase] 第 ${page} 页: ${collectionsWithDuration.length} 个 collections (总计: ${count}, 还有更多: ${hasMore})`)
    
    return {
      collections: collectionsWithDuration,
      totalPages,
      totalCount: count || 0,
      currentPage: page,
      hasMore
    }
  } catch (error) {
    console.error('❌ [Supabase] getAllCollectionsPaginated 错误:', error)
    return { 
      collections: [], 
      totalPages: 1, 
      totalCount: 0,
      currentPage: page,
      hasMore: false
    }
  }
}
