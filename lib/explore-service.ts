import { createClient } from '@/utils/supabase/client';
import type { Book } from './types';

const EXPLORE_BOOK_FIELDS = 'id, slug, title, subtitle, authors, cover_image, rating, ratings_count, audio_duration, is_premium, one_liner, summary_audio, preview_audio_url, status, created_at';

/**
 * Search and filter parameters interface for explore page
 */
export interface ExploreFilters {
  searchQuery?: string;
  genres?: string[];
  minRating?: number;
  isPremium?: boolean | null; // null means all, true means premium only, false means free only
  sortBy?: 'latest' | 'rating' | 'title' | 'author';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination parameters interface for explore page
 */
export interface ExplorePagination {
  page: number;
  limit: number;
}

/**
 * Search results interface for explore page
 */
export interface ExploreResult {
  books: Book[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Get all available book genres/types
 * @returns List of genres with name and slug
 */
export async function getAvailableGenres(): Promise<{ title: string, slug: string }[]> {
  try {
    console.log('🔍 从 Supabase genres 表获取分类列表')

    const supabase = createClient()
    
    const { data: genres, error } = await supabase
      .from('genres')
      .select('name, slug')
      .order('name')

    if (error) {
      console.warn('⚠️ genres 表查询失败，使用备用分类数据:', error)
      return getFallbackGenres()
    }

    if (!genres || genres.length === 0) {
      console.log('📋 genres 表为空，使用备用分类数据')
      return getFallbackGenres()
    }

    console.log(`📊 从 genres 表获取到 ${genres.length} 个分类`)

    const mappedGenres = genres.map((genre: any) => ({
      title: genre.name,
      slug: genre.slug || genre.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))

    // 去重
    const uniqueGenres = []
    const seenSlugs = new Set()
    for (const g of mappedGenres) {
      if (!seenSlugs.has(g.slug)) {
        seenSlugs.add(g.slug)
        uniqueGenres.push(g)
      }
    }

    return uniqueGenres
  } catch (error) {
    console.error('Failed to get genres list:', error)
    return getFallbackGenres()
  }
}

/**
 * Get fallback genres list
 */
function getFallbackGenres(): { title: string, slug: string }[] {
  const fallbackGenres = [
    'Self-Help', 'Psychology', 'Business', 'Fiction', 'Romance',
    'Biography', 'Non-Fiction', 'Mystery', 'Fantasy', 'History',
    'Health', 'Technology', 'Education', 'Science', 'Philosophy'
  ]

  return fallbackGenres.map(title => ({
    title,
    slug: title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }))
}

/**
 * Get genre by slug from genres table
 * @param slug Genre slug
 * @returns Genre data or null if not found
 */
export async function getGenreBySlug(slug: string): Promise<{ title: string, subtitle?: string, description?: string } | null> {
  try {
    console.log(`🔍 尝试获取分类数据，slug: ${slug}`)

    const supabase = createClient()
    
    const { data: genre, error } = await supabase
      .from('genres')
      .select('name, slug, subtitle, description')
      .eq('slug', slug)
      .single()

    if (error || !genre) {
      console.warn('⚠️ genres 表查询失败或未找到，使用备用分类数据')
      return getFallbackGenreBySlug(slug)
    }

    console.log(`✅ 找到匹配的分类: ${genre.name}`)
    return {
      title: genre.name,
      subtitle: genre.subtitle || '',
      description: genre.description || `Explore our collection of ${genre.name} books`
    }
  } catch (error) {
    console.error('Failed to get genre by slug:', error)
    return getFallbackGenreBySlug(slug)
  }
}

/**
 * Get fallback genre by slug
 */
function getFallbackGenreBySlug(slug: string): { title: string, subtitle?: string, description?: string } | null {
  const fallbackGenres = [
    { title: 'Business', subtitle: 'Master the art of business and entrepreneurship', description: 'Master the art of business and entrepreneurship' },
    { title: 'Psychology', subtitle: 'Understand the human mind and behavior', description: 'Understand the human mind and behavior' },
    { title: 'Biography', subtitle: 'Life stories of remarkable people', description: 'Life stories of remarkable people' },
    { title: 'History', subtitle: 'Journey through time and historical events', description: 'Journey through time and historical events' },
    { title: 'Science', subtitle: 'Explore the wonders of scientific discovery', description: 'Explore the wonders of scientific discovery' },
    { title: 'Philosophy', subtitle: 'Deep thoughts and philosophical insights', description: 'Deep thoughts and philosophical insights' },
    { title: 'Health', subtitle: 'Your guide to wellness and healthy living', description: 'Your guide to wellness and healthy living' },
    { title: 'Technology', subtitle: 'Innovation and technological advancement', description: 'Innovation and technological advancement' },
    { title: 'Romance', subtitle: 'Love stories that warm the heart', description: 'Love stories that warm the heart' },
    { title: 'Mystery', subtitle: 'Thrilling mysteries and detective stories', description: 'Thrilling mysteries and detective stories' },
    { title: 'Fantasy', subtitle: 'Magical worlds and epic adventures', description: 'Magical worlds and epic adventures' },
    { title: 'Science Fiction', subtitle: 'Future worlds and sci-fi adventures', description: 'Future worlds and sci-fi adventures' },
    { title: 'Non-Fiction', subtitle: 'Real stories and factual content', description: 'Real stories and factual content' },
    { title: 'Education', subtitle: 'Learning and educational resources', description: 'Learning and educational resources' },
    { title: 'Self-Help', subtitle: 'Personal development and growth', description: 'Personal development and growth' }
  ]

  // 将slug转换回title并匹配
  const targetTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  console.log(`🔍 在备用数据中查找: ${targetTitle}`)

  const fallbackMatch = fallbackGenres.find(genre =>
    genre.title.toLowerCase() === targetTitle.toLowerCase() ||
    genre.title.toLowerCase().replace(/\s+/g, '-') === slug
  )

  if (fallbackMatch) {
    console.log(`✅ 在备用数据中找到匹配: ${fallbackMatch.title}`)
    return fallbackMatch
  }

  console.log(`❌ 未找到匹配的分类: ${slug}`)
  return null
}

/**
 * Search books based on filter conditions
 * @param filters Filter conditions
 * @param pagination Pagination parameters
 * @returns Search results
 */
export async function searchBooks(
  filters: ExploreFilters = {},
  pagination: ExplorePagination = { page: 1, limit: 12 }
): Promise<ExploreResult> {
  try {
    const {
      searchQuery,
      genres,
      minRating,
      isPremium,
      sortBy = 'latest',
      sortOrder = 'desc'
    } = filters

    const { page, limit } = pagination

    const supabase = createClient()
    
    // Start building query
    let query = supabase
      .from('books')
      .select(`${EXPLORE_BOOK_FIELDS}, book_genres!inner(genre_id, genres(name, slug))`, { count: 'exact' })
      .eq('status', 'published')

    // Search query (title or author)
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim()
      query = query.or(`title.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`)
    }

    // Genre filtering
    if (genres && genres.length > 0) {
      // Get genre IDs from names
      const { data: genreData } = await supabase
        .from('genres')
        .select('id, name')
        .in('name', genres)

      if (genreData && genreData.length > 0) {
        const genreIds = genreData.map(g => g.id)
        query = query.in('book_genres.genre_id', genreIds)
        
        console.log('🏷️ Genre filtering:', {
          selectedGenres: genres,
          foundGenreIds: genreIds
        })
      }
    }

    // Rating filtering
    if (minRating && minRating > 0) {
      query = query.gte('rating', minRating)
    }

    // Premium type filtering
    if (isPremium === true) {
      query = query.eq('is_premium', true)
    } else if (isPremium === false) {
      query = query.eq('is_premium', false)
    }

    // Sorting
    const ascending = sortOrder === 'asc'
    switch (sortBy) {
      case 'latest':
        query = query.order('created_at', { ascending })
        break
      case 'rating':
        query = query.order('rating', { ascending })
        break
      case 'title':
        query = query.order('title', { ascending })
        break
      case 'author':
        query = query.order('authors', { ascending })
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    console.log('🔍 Search conditions:', {
      searchQuery,
      genres,
      minRating,
      isPremium,
      sortBy,
      sortOrder,
      page,
      limit
    })

    const { data: books, error, count } = await query

    if (error) {
      console.error('Search books failed:', error)
      throw error
    }

    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / limit)

    console.log(`📚 Search results: ${books?.length || 0} books found (total: ${totalItems})`)

    return {
      books: (books || []) as unknown as Book[],
      totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  } catch (error) {
    console.error('Search books failed:', error)
    throw error
  }
}

/**
 * Get popular book recommendations (for default display on explore page)
 * @param limit Number limit
 * @returns Popular books list
 */
export async function getPopularBooks(limit: number = 12): Promise<Book[]> {
  try {
    const supabase = createClient()
    
    const { data: books, error } = await supabase
      .from('books')
      .select(`${EXPLORE_BOOK_FIELDS}, book_genres(genres(name, slug))`)
      .eq('status', 'published')
      .eq('is_popular', true)
      .not('summary_audio', 'is', null)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get popular books:', error)
      return []
    }

    return (books || []) as unknown as Book[]
  } catch (error) {
    console.error('Failed to get popular books:', error)
    return []
  }
}

/**
 * Get latest books
 * @param limit Number limit
 * @returns Latest books list
 */
export async function getLatestBooks(limit: number = 12): Promise<Book[]> {
  try {
    const supabase = createClient()
    
    const { data: books, error } = await supabase
      .from('books')
      .select(`${EXPLORE_BOOK_FIELDS}, book_genres(genres(name, slug))`)
      .eq('status', 'published')
      .not('summary_audio', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get latest books:', error)
      return []
    }

    return (books || []) as unknown as Book[]
  } catch (error) {
    console.error('Failed to get latest books:', error)
    return []
  }
}
