import PocketBase from 'pocketbase';
import type { BookSection, Advertisement, Book, Series } from './types';
import pb from './pocketbase';
import { titleToSlug, isValidId } from './slug-utils';
import { ensureAdminAuth } from './pocketbase-auth';

/**
 * 检查参数是否为tag格式
 */
export function isTagFormat(param: string): boolean {
  // 如果参数以 "tag-" 开头，则认为是tag格式
  return param.startsWith('tag-');
}

/**
 * 检查参数是否为tag slug格式
 */
export async function isTagSlug(param: string): Promise<boolean> {
  try {
    // 检查数据库中是否有 blog 包含这个 tag
    const seriesList = await pb.collection('blog').getFullList({
      fields: 'tags,slug'
    });

    const normalizedSlug = param.toLowerCase();
    return seriesList.some(s => {
      const tags = s.tags || [];
      return tags.some((tag: any) => titleToSlug(String(tag)).toLowerCase() === normalizedSlug);
    });
  } catch (error) {
    return false;
  }
}

/**
 * 随机打乱数组
 * @param array 要打乱的数组
 * @returns 打乱后的新数组
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}




/**
 * 直接从 booklist 表获取所有启用的模块
 * 替代 home_modules → booklist 的两层查询
 * @returns 按 sort_order 排序的 BookSection 列表（含展开的书本和作者数据）
 */
export async function getAllBookSections(): Promise<{
  bookSection: BookSection;
  books: Book[];
}[]> {
  try {
    console.log('📚 直接从 booklist 表获取所有启用模块...');
    
    // 在查询前检查管理员认证
    await ensureAdminAuth();
    
    const records = await pb.collection('booklist').getFullList<BookSection>({
      filter: 'is_enabled = true',
      sort: 'sort_order',
      expand: 'selected_books',
    });

    console.log(`✅ 获取到 ${records.length} 个 booklist 模块`);

    return records.map(section => ({
      bookSection: section,
      books: ((section.expand?.selected_books as any[]) || []).filter(
        (book: any) => book.status === 'published'
      ),
    }));
  } catch (error) {
    console.error('获取 booklist 列表失败:', error);
    return [];
  }
}

/**
 * 根据ID获取BookSection数据（适配现有的booklist表）
 * @param bookSectionId booklist表的ID
 * @returns BookSection数据，包含关联的书本
 */
export async function getBookSectionWithBooks(bookSectionId: string): Promise<{
  bookSection: BookSection;
  books: Book[];
} | null> {
  try {
    // 获取BookSection配置，并展开selected_books关联
    const bookSection = await pb.collection('booklist').getOne<BookSection>(bookSectionId, {
      expand: 'selected_books',
    });

    console.log(`📚 Fetching BookSection ${bookSectionId}:`, {
      id: bookSection.id,
      selected_books_count: bookSection.selected_books?.length,
      expand_count: bookSection.expand?.selected_books?.length,
      layout: bookSection.layout,
      has_expand: !!bookSection.expand,
      selected_books_sample: bookSection.selected_books?.slice(0, 2)
    });

    let books: Book[] = [];

    // 检查 expand 是否成功
    if (bookSection.expand?.selected_books && Array.isArray(bookSection.expand.selected_books)) {
      // expand 成功，直接使用展开的数据
      books = (bookSection.expand.selected_books as any[]).filter(
        (book: any) => book.status === 'published'
      );
    } else if (bookSection.selected_books && bookSection.selected_books.length > 0) {
      // expand 失败，手动获取书籍数据
      console.log('⚠️ Expand failed, manually fetching books...');
      const bookIds = bookSection.selected_books;
      const fetchedBooks = await pb.collection('books').getFullList({
        filter: `id ~ "${bookIds.join('|')}" && status = "published"`,
      });
      books = fetchedBooks as any[];
    }

    console.log(`✅ Retrieved ${books.length} books for section ${bookSectionId}`);

    return {
      bookSection,
      books,
    };
  } catch (error) {
    console.error(`获取BookSection ${bookSectionId} 失败:`, error);
    return null;
  }
}



/**
 * 获取最新的Blog（固定3个）
 * @returns 最新的Blog列表
 */
export async function getLatestSeries(): Promise<Series[]> {
  try {
    const records = await pb.collection('blog').getList<any>(1, 3, {
      sort: '-created',
    });

    // 为每个series计算实际的书本数量并转换数据结构
    const seriesWithBookCount = records.items.map((seriesItem: any) => {
      try {
        // 从content字段中解析书本引用 [book:book_id] 格式
        const content = seriesItem.content || "";
        const bookMatches = content.match(/\[book:[^\]]+\]/g) || [];

        // 直接构建图片URL
        const coverImageUrl = seriesItem.cover_image ? pb.files.getURL(seriesItem, seriesItem.cover_image) : '';

        return {
          id: seriesItem.id,
          title: seriesItem.name || seriesItem.title || 'Untitled Series', // 确保title字段存在
          description: seriesItem.description || 'No description available',
          cover_image: coverImageUrl, // 直接使用构建好的URL
          total_books: bookMatches.length, // 使用解析出的书本数量
          created: seriesItem.created,
          updated: seriesItem.updated,
        } as Series;
      } catch (error) {
        console.error(`处理series ${seriesItem.id} 失败:`, error);
        return {
          id: seriesItem.id,
          title: seriesItem.name || seriesItem.title || 'Untitled Series',
          description: seriesItem.description || 'No description available',
          cover_image: seriesItem.cover_image ? pb.files.getURL(seriesItem, seriesItem.cover_image) : '',
          total_books: 0,
          created: seriesItem.created,
          updated: seriesItem.updated,
        } as Series;
      }
    });

    console.log(`📚 获取到 ${seriesWithBookCount.length} 个Series:`, seriesWithBookCount.map(s => ({ id: s.id, title: s.title, total_books: s.total_books, cover_image: s.cover_image ? '有图片' : '无图片' })));

    return seriesWithBookCount;
  } catch (error) {
    console.error('获取最新Series失败:', error);
    return [];
  }
}



/**
 * 简化版推荐书籍函数
 * 基于 is_popular 字段和用户分类偏好
 * @param userId 用户ID（可选）
 * @param limit 返回书籍数量限制，默认5本
 * @param refresh 是否刷新推荐（随机化结果），默认false
 * @param excludeBooks 需要排除的书籍ID列表（用于避免重复）
 * @returns 推荐的书籍列表
 */
export async function getRecommendedBooks(
  userId?: string,
  limit: number = 12,
  refresh: boolean = false,
  excludeBooks: string[] = []
): Promise<Book[]> {
  try {
    console.log(`🎯 开始获取推荐书籍 - 用户ID: ${userId || '未登录'}, 刷新: ${refresh}`)

    if (userId) {
      // 已登录用户：基于用户书架分类的个性化推荐
      console.log('👤 已登录用户，使用个性化推荐策略')
      return await getPersonalizedRecommendations(userId, limit, refresh, excludeBooks)
    } else {
      // 未登录用户：从热门书籍中随机推荐
      console.log('👥 未登录用户，使用热门书籍随机推荐')
      return await getPopularBooksRecommendations(limit, refresh, excludeBooks)
    }
  } catch (error) {
    console.error('获取推荐书籍失败:', error)
    // 降级策略：返回最新的高评分书籍
    return await getFallbackRecommendations(limit, excludeBooks)
  }
}

/**
 * 获取个性化推荐（已登录用户）
 * 基于用户书架中的书籍分类
 */
async function getPersonalizedRecommendations(
  userId: string,
  limit: number,
  refresh: boolean,
  excludeBooks: string[]
): Promise<Book[]> {
  try {
    // 1. 获取用户书架中的书籍分类
    const userBooks = await pb.collection('user_library').getFullList({
      filter: `user = "${userId}"`,
      expand: 'book.genres'  // 展开book和genres关联
    })

    // 2. 统计用户偏好的分类
    const categoryPreferences = new Map<string, number>()
    userBooks.forEach(bookshelf => {
      const book = bookshelf.expand?.book
      if (book?.genres) {
        book.genres.forEach((genre: any) => {
          // 处理新的关联数据结构
          const genreTitle = typeof genre === 'string' ? genre : genre.title
          if (genreTitle) {
            categoryPreferences.set(genreTitle, (categoryPreferences.get(genreTitle) || 0) + 1)
          }
        })
      }
    })

    // 3. 获取用户已有的书籍ID（需要排除）
    const userBookIds = userBooks.map(bs => bs.book)
    const allExcludeBooks = [...excludeBooks, ...userBookIds]

    if (categoryPreferences.size === 0) {
      // 用户书架为空，降级到热门推荐
      console.log('📚 用户书架为空，使用热门推荐')
      return await getPopularBooksRecommendations(limit, refresh, allExcludeBooks)
    }

    // 4. 按分类偏好权重获取推荐
    const sortedCategories = Array.from(categoryPreferences.entries())
      .sort((a, b) => b[1] - a[1]) // 按阅读数量降序
      .map(([category]) => category)

    console.log('📊 用户分类偏好:', sortedCategories.slice(0, 10))

    // 5. 从用户偏好分类中获取热门书籍 (前10个分类, rating >= 4.0)
    const recommendations: Book[] = []
    const topCategories = sortedCategories.slice(0, 10)

    // 计算每个分类应取的数量，至少取1本
    // 如果想要更均匀的分布，可以尝试一次性获取更多，然后客户端洗牌
    // 这里为了性能，我们对前10个分类每个取一点
    const booksPerCategory = Math.ceil(limit / Math.max(topCategories.length, 1)) * 2 // 多取一些用于随机

    for (const category of topCategories) {
      if (recommendations.length >= limit * 2) break // 获取足够多的候选项

      const categoryFilter = `genres.name ~ "${category}" && rating >= 4 && status = "published"`
      const excludeFilter = allExcludeBooks.length > 0
        ? ` && id != "${allExcludeBooks.join('" && id != "')}"`
        : ''

      // 每次取少量，随机排序
      const categoryBooks = await pb.collection('books').getList<Book>(1, 5, {
        filter: categoryFilter + excludeFilter,
        sort: '-rating,-created', // STABLE SEO SORT
        expand: 'genres'  // 展开genres关联
      })

      const plainBooks = JSON.parse(JSON.stringify(categoryBooks.items)) as Book[]
      recommendations.push(...plainBooks)
    }

    // 去重 (因为一本书可能有多个分类)
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(book => [book.id, book])).values()
    )

    // 6. 如果推荐数量不足，用高评分书籍补充 (rating > 4.3)
    if (uniqueRecommendations.length < limit) {
      const remainingLimit = limit - uniqueRecommendations.length
      const usedBookIds = uniqueRecommendations.map(book => book.id)
      const finalExcludeBooks = [...allExcludeBooks, ...usedBookIds]

      const additionalBooks = await getHighRatedRecommendations(
        remainingLimit,
        refresh,
        finalExcludeBooks,
        4.3 // 补充时要求更高评分
      )
      uniqueRecommendations.push(...additionalBooks)
    }

    // 7. 随机打乱并限制数量
    const finalRecommendations = shuffleArray(uniqueRecommendations).slice(0, limit)

    console.log(`✅ 个性化推荐完成，返回 ${finalRecommendations.length} 本书籍`)
    return finalRecommendations

  } catch (error) {
    console.error('个性化推荐失败:', error)
    return await getPopularBooksRecommendations(limit, refresh, excludeBooks) // Fallback to general
  }
}

/**
 * 获取高评分书籍推荐 (原热门推荐)
 * 现在的逻辑是: rating >= 4.0
 */
/**
 * 从未登录用户的推荐模块中随机选取书籍
 * 从 booklist 表的 selected_books 字段中获取
 */
async function getPopularBooksRecommendations(
  limit: number,
  refresh: boolean,
  excludeBooks: string[] = []
): Promise<Book[]> {
  try {
    console.log('📚 从未登录用户推荐模块中随机选取书籍...')
    
    // 获取所有推荐模块（type = 'recommended'）
    const recommendedSections = await pb.collection('booklist').getFullList({
      filter: 'type = "recommended" && is_enabled = true',
      expand: 'selected_books',
    })
    
    console.log(`🔍 找到 ${recommendedSections.length} 个推荐模块`)
    
    if (recommendedSections.length === 0) {
      console.log('⚠️ 未找到推荐模块，使用降级策略')
      return await getHighRatedRecommendations(limit, refresh, excludeBooks, 4.0)
    }
    
    // 收集所有推荐模块中的书籍
    let allBooks: Book[] = []
    
    for (const section of recommendedSections) {
      const selectedBooks = section.selected_books || []
      if (selectedBooks.length > 0) {
        // 获取这些书籍的详细信息
        const books = await pb.collection('books').getFullList({
          filter: `id ~ "${selectedBooks.join('|')}" && status = "published"`,
          expand: 'genres',
        })
        allBooks = [...allBooks, ...books as any[]]
      }
    }
    
    console.log(`📚 从推荐模块中收集到 ${allBooks.length} 本书籍`)
    
    if (allBooks.length === 0) {
      console.log('⚠️ 推荐模块中没有可用书籍，使用降级策略')
      return await getHighRatedRecommendations(limit, refresh, excludeBooks, 4.0)
    }
    
    // 去重
    const uniqueBooks = allBooks.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    )
    
    // 排除指定的书籍
    const filteredBooks = uniqueBooks.filter(book => 
      !excludeBooks.includes(book.id)
    )
    
    console.log(`🎯 去重并过滤后剩余 ${filteredBooks.length} 本书籍`)
    
    if (filteredBooks.length === 0) {
      console.log('⚠️ 过滤后没有可用书籍，使用降级策略')
      return await getHighRatedRecommendations(limit, refresh, excludeBooks, 4.0)
    }
    
    // 随机打乱并返回指定数量的书籍
    const shuffled = shuffleArray(filteredBooks)
    return shuffled.slice(0, limit)
    
  } catch (error) {
    console.error('从推荐模块获取书籍失败:', error)
    // 降级策略：使用原来的高评分推荐
    return await getHighRatedRecommendations(limit, refresh, excludeBooks, 4.0)
  }
}

/**
 * 获取高评分书籍通用函数
 */
async function getHighRatedRecommendations(
  limit: number,
  refresh: boolean,
  excludeBooks: string[] = [],
  minRating: number = 4.0
): Promise<Book[]> {
  try {
    const excludeFilter = excludeBooks.length > 0
      ? ` && id != "${excludeBooks.join('" && id != "')}"`
      : ''

    const sort = '-rating,-created' // STABLE SEO SORT
    const finalFilter = `rating >= ${minRating} && status = "published"${excludeFilter}`

    console.log(`🔍 高评分推荐查询条件: ${finalFilter}`)

    // 多取一些以便随机性更好
    const result = await pb.collection('books').getList<Book>(1, limit * 2, {
      filter: finalFilter,
      sort: '-rating,-created', // STABLE SEO SORT
      expand: 'genres'
    })

    console.log(`📚 查询到 ${result.items.length} 本高评分书籍`)

    const books = shuffleArray(JSON.parse(JSON.stringify(result.items)) as Book[]).slice(0, limit)
    return books

  } catch (error) {
    console.error('高评分推荐失败:', error)
    return await getFallbackRecommendations(limit, excludeBooks)
  }
}

/**
 * 降级策略：获取最新高评分书籍
 */
async function getFallbackRecommendations(
  limit: number,
  excludeBooks: string[] = []
): Promise<Book[]> {
  try {
    const excludeFilter = excludeBooks.length > 0
      ? ` && id != "${excludeBooks.join('" && id != "')}"`
      : ''

    const result = await pb.collection('books').getList<Book>(1, limit, {
      filter: `rating >= 4 && status = "published"${excludeFilter}`,
      sort: '-created', // 降级时用时间排序保证有结果
      expand: 'genres'
    })

    console.log(`⚠️ 使用降级策略，返回 ${result.items.length} 本书籍`)
    return result.items

  } catch (error) {
    console.error('降级策略也失败了:', error)
    return []
  }
}

/**
 * 获取基于特定分类的推荐书籍 (用于详情页侧边栏)
 */
export async function getGenreBasedRecommendations(
  genres: string[], // Genre names
  limit: number = 12,
  excludeId?: string
): Promise<Book[]> {
  try {
    console.log(`🎯 基于分类获取推荐: ${genres.join(', ')}`)

    if (!genres || genres.length === 0) {
      return getHighRatedRecommendations(limit, true, excludeId ? [excludeId] : [])
    }

    const genreFilters = genres.map(g => `genres.name ~ "${g}"`).join(' || ')
    const excludeFilter = excludeId ? ` && id != "${excludeId}"` : ''
    // 筛选: 分类匹配 && rating >= 4.0 && published && not current && has audio
    const filter = `(${genreFilters}) && rating >= 4 && status = "published"${excludeFilter}`

    const result = await pb.collection('books').getList<Book>(1, limit * 2, {
      filter,
      sort: '-rating,-created', // STABLE SEO SORT
      expand: 'genres'
    })

    let books = JSON.parse(JSON.stringify(result.items)) as Book[]

    // 如果数量不够，用高评分书补充
    if (books.length < limit) {
      const excludeIds = [excludeId, ...books.map((b: Book) => b.id)].filter(Boolean) as string[]
      const moreBooks = await getHighRatedRecommendations(limit - books.length, true, excludeIds)
      books = [...books, ...moreBooks]
    }

    return shuffleArray(books).slice(0, limit)

  } catch (error) {
    console.error('基于分类推荐失败:', error)
    return getHighRatedRecommendations(limit, true, excludeId ? [excludeId] : [])
  }
}











/**
 * 构建文件URL（支持PocketBase文件名和完整URL）
 * @param record 记录对象
 * @param filename 文件名或完整URL
 * @param thumb 缩略图尺寸（可选）
 * @returns 完整的文件URL
 */
export function getFileUrl(record: any, filename: string, thumb?: string): string {
  // 如果 filename 已经是完整的 URL（如 R2 URL），直接返回
  if (filename && (filename.startsWith('http://') || filename.startsWith('https://'))) {
    return filename;
  }
  
  // 否则使用 PocketBase 的 URL 构建方法
  return pb.files.getURL(record, filename, { thumb });
}



/**
 * 基于用户偏好的通用推荐函数
 * @param userId 用户ID
 * @param preferences 用户偏好分类数组
 * @param limit 返回数量限制
 * @param excludeBooks 排除的书籍ID
 * @param sortBy 排序方式
 * @returns 推荐书籍列表
 */
async function getRecommendationsByPreferences(
  userId: string,
  preferences: string[],
  limit: number,
  excludeBooks: string[] = [],
  sortBy: string = '-rating,-created'
): Promise<Book[]> {
  try {
    console.log(`🎯 基于偏好获取推荐 - 偏好: [${preferences.join(', ')}], 排除: ${excludeBooks.length} 本`)

    // 生成基于偏好的过滤条件 - 使用name字段
    const genreFilters = preferences.map(pref => `genres.name ~ "${pref}"`).join(' || ') // 更新：使用name字段
    const excludeFilter = excludeBooks.length > 0
      ? ` && id != "${excludeBooks.join('" && id != "')}"`
      : ''

    const filter = `(${genreFilters}) && status = "published"${excludeFilter}`
    console.log(`🔍 偏好推荐查询条件: ${filter}`)

    const result = await pb.collection('books').getList<Book>(1, limit, {
      filter,
      sort: sortBy,
      expand: 'genres'  // 展开genres关联
    })

    console.log(`📚 偏好推荐结果: ${result.items.length} 本书籍`)
    return JSON.parse(JSON.stringify(result.items)) as Book[]

  } catch (error) {
    console.error('基于偏好的推荐失败:', error)
    return []
  }
}

/**
 * 根据标签获取推荐Series
 */
export async function getRecommendedSeries(tags: string[], currentId: string): Promise<Series[]> {
  try {
    if (!tags || tags.length === 0) return []

    // 构建标签过滤条件
    const tagFilters = tags.map(tag => `tags ~ "${tag}"`).join(' || ')
    const filter = `id != "${currentId}" && (${tagFilters})`

    const records = await pb.collection('blog').getList(1, 4, {
      filter,
      sort: '-created'
    })

    return records.items.map((item: any) => ({
      id: item.id,
      title: item.title || item.name || 'Untitled',
      description: item.description,
      status: item.status,
      image: item.cover_image ? pb.files.getURL(item, item.cover_image) : '',
      tags: item.tags || []
    } as any))

  } catch (error) {
    console.error('Failed to get recommended series:', error)
    return []
  }
}

/**
 * 获取所有Blog的标签
 */
export async function getAllSeriesTags(): Promise<string[]> {
  try {
    const records = await pb.collection('blog').getFullList({
      fields: 'tags,slug'
    })

    const tagSet = new Set<string>()
    records.forEach((record: any) => {
      if (record.tags && Array.isArray(record.tags)) {
        record.tags.forEach((tag: string) => tagSet.add(tag))
      }
    })

    return Array.from(tagSet).sort()
  } catch (error) {
    console.error('Failed to get all series tags:', error)
    return []
  }
}

/**
 * 获取用户偏好分类
 */
export async function getUserPreferences(userId: string, limit: number = 3): Promise<string[]> {
  try {
    const userLibrary = await pb.collection('user_library').getFullList({
      filter: `user = "${userId}"`,
      expand: 'book.genres'
    });

    const genreCounts: Record<string, number> = {};
    userLibrary.forEach((item) => {
      const book = item.expand?.book;
      if (book?.genres) {
        // Handle both string[] (old) and object[] (expanded)
        const genres = Array.isArray(book.genres) ? book.genres : [];
        genres.forEach((g: any) => {
          const name = typeof g === 'string' ? g : g.name || g.title;
          if (name) {
            genreCounts[name] = (genreCounts[name] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name]) => name);
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return [];
  }
}

/**
 * 获取首页推荐书籍
 * @param userId 用户ID (可选)
 * @param refresh 是否刷新推荐
 * @returns 推荐书籍列表
 */
export async function getHomeRecommendedBooks(
  userId?: string,
  refresh = false
): Promise<Book[]> {
  try {
    console.log(`🎯 开始获取首页推荐 - 用户ID: ${userId || '未登录'}, 刷新: ${refresh}`)

    if (!userId) {
      console.log('👥 未登录用户，使用热门书籍随机推荐')
      return getPopularBooksRecommendations(5, false, refresh ? ['@random'] : ['-rating,-created'])
    }

    console.log('👤 已登录用户，获取个性化推荐')

    // 获取用户偏好 - 5个偏好分类（增加到5个）
    const userPreferences = await getUserPreferences(userId, 5) // 增加到5个偏好
    console.log(`📊 用户偏好分析结果: [${userPreferences.join(', ')}]`)

    if (userPreferences.length === 0) {
      console.log('📭 用户无偏好数据，使用热门推荐')
      return getPopularBooksRecommendations(5, false, refresh ? ['@random'] : ['-rating,-created'])
    }

    // 基于偏好获取推荐
    const preferenceBooks = await getRecommendationsByPreferences(
      userId,
      userPreferences,
      5,
      [],
      refresh ? '@random' : '-rating,-created'
    )

    if (preferenceBooks.length >= 5) {
      console.log(`✅ 偏好推荐充足，返回 ${preferenceBooks.length} 本书籍`)
      return preferenceBooks.slice(0, 5)
    }

    // 如果偏好推荐不足，补充热门推荐
    console.log(`📚 偏好推荐不足(${preferenceBooks.length}本)，补充热门推荐`)
    const excludeIds = preferenceBooks.map(book => book.id)
    const additionalBooks = await getPopularBooksRecommendations(
      5 - preferenceBooks.length,
      refresh,
      excludeIds
    )

    const finalRecommendations = [...preferenceBooks, ...additionalBooks]
    console.log(`✅ 首页推荐完成，返回 ${finalRecommendations.length} 本书籍`)
    return finalRecommendations

  } catch (error) {
    console.error('获取首页推荐失败:', error)
    return await getFallbackRecommendations(5)
  }
}

/**
 * 获取侧边栏推荐书籍
 * @param userId 用户ID (可选)
 * @param limit 返回数量限制
 * @param excludeBooks 排除的书籍ID
 * @returns 推荐书籍列表
 */
export async function getSidebarRecommendedBooks(
  userId?: string,
  limit: number = 6,
  excludeBooks: string[] = []
): Promise<Book[]> {
  try {
    console.log(`📖 书本详情页侧边栏开始获取推荐 - BookID: ${excludeBooks.join(',')}, UserID: ${userId || '未登录'}`)

    if (!userId) {
      console.log('👥 未登录用户，使用热门书籍推荐')
      return getPopularBooksRecommendations(limit, false, excludeBooks)
    }

    console.log('👤 已登录用户，获取个性化推荐')

    // 获取用户偏好 - 3个主要偏好
    const userPreferences = await getUserPreferences(userId, 3)
    console.log(`📊 侧边栏用户偏好: [${userPreferences.join(', ')}]`)

    if (userPreferences.length === 0) {
      console.log('📭 用户无偏好数据，使用热门推荐')
      return getPopularBooksRecommendations(limit, false, excludeBooks)
    }

    // 基于偏好获取推荐
    const preferenceBooks = await getRecommendationsByPreferences(
      userId,
      userPreferences,
      limit,
      excludeBooks
    )

    if (preferenceBooks.length >= limit) {
      console.log(`✅ 侧边栏偏好推荐充足: ${preferenceBooks.length} 本`)
      return preferenceBooks.slice(0, limit)
    }

    // 补充热门推荐
    console.log(`📚 侧边栏偏好推荐不足(${preferenceBooks.length}本)，补充热门推荐`)
    const allExcludeIds = [...excludeBooks, ...preferenceBooks.map(book => book.id)]
    const additionalBooks = await getPopularBooksRecommendations(
      limit - preferenceBooks.length,
      false,
      allExcludeIds
    )

    const finalBooks = [...preferenceBooks, ...additionalBooks]
    console.log(`📖 书本详情页侧边栏获得推荐: ${finalBooks.length} 本书`)
    return finalBooks

  } catch (error) {
    console.error('获取侧边栏推荐失败:', error)
    return await getFallbackRecommendations(limit, excludeBooks)
  }
}

export async function getBookDetailData(bookId: string) {
  try {
    console.log(`📚 Fetching book detail data for ID: ${bookId}`);
    
    // 在查询前检查管理员认证
    await ensureAdminAuth();
    
    const record = await pb.collection('books').getOne(bookId, {
      expand: 'genres',
      // cache: 'no-store' // allow nextjs to control caching
    });

    console.log(`✅ Book data retrieved for ID: ${bookId}`);
    console.log(`📖 Book title: ${record.title}`);
    console.log(`📊 Book status: ${record.status}`);

    // Convert to plain object to avoid serialization issues with PocketBase Record class
    // in Next.js Server Components
    const bookData = JSON.parse(JSON.stringify(record)) as any;

    // Check if book is published
    if (bookData.status && bookData.status !== 'published') {
      console.log(`Book ${bookId} is not published (status: ${bookData.status})`);
      return null;
    }

    // 处理genres数据
    if (bookData.expand?.genres) {
      bookData.genres = bookData.expand.genres;
    }

    // 处理章节数据 - 仅基于 summary_audio 生成虚拟章节
    let chaptersList: any[] = [];
    let summaryAudioList: string[] = [];

    if (bookData.summary_audio) {
      if (Array.isArray(bookData.summary_audio)) {
        summaryAudioList = bookData.summary_audio;
      } else if (typeof bookData.summary_audio === 'string') {
        if (bookData.summary_audio.includes(',')) {
          summaryAudioList = bookData.summary_audio.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        } else {
          summaryAudioList = [bookData.summary_audio];
        }
      }
    }

    if (summaryAudioList.length > 0) {
      // Helper for formatting
      const formatChapterTitle = (filename: string) => {
        if (!filename) return '';
        const lastDotIndex = filename.lastIndexOf('.');
        let nameWithoutExt = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
        const words = nameWithoutExt.split(/[_\s]+/);
        const formattedWords = words.map(word => {
          if (word.length === 0) return '';
          return word.charAt(0).toUpperCase() + word.slice(1);
        });
        return formattedWords.join(' ');
      }

      chaptersList = summaryAudioList.map((audioFile, index) => ({
        id: `chapter_${index + 1}`,
        title: formatChapterTitle(audioFile),
        audio_file: audioFile,
        is_free: false,
        chapter_duration_seconds: 0,
        order: index + 1,
        is_from_book: true // 标记这个章节来源于书本记录
      }));
    }

    return {
      book: bookData,
      chapters: chaptersList
    };
  } catch (error: any) {
    console.error('❌ Error fetching book detail:', error);
    console.error('📋 Error details:', {
      message: error.message,
      status: error.status,
      url: error.url,
      data: error.data
    });
    return null;
  }
}

/**
 * 获取所有分类 (Genres) 并按 ID 排序
 */
export async function getAllGenres() {
  try {
    const records = await pb.collection('genres').getFullList({
      sort: 'id',
    });
    return records;
  } catch (error) {
    console.error('Error fetching all genres:', error);
    return [];
  }
}

/**
 * 获取所有分类 (Categories) 及其关联的 Genres
 * 从 category 表中获取数据，包含 name 和关联的 genres
 */
export async function getCategoriesWithGenres() {
  try {
    // 从 category 表获取数据，并展开关联的 genres
    const records = await pb.collection('category').getFullList({
      sort: 'name',
      expand: 'genres'
    });
    
    // 格式化为组件需要的结构
    return records.map((category: any) => ({
      category: category.name,  // category 表的 name 字段
      genres: category.expand?.genres?.map((genre: any) => ({
        id: genre.id,
        name: genre.name
      })) || []
    }));
  } catch (error) {
    console.error('Error fetching categories with genres:', error);
    return [];
  }
}

/**
 * 获取最新更新的书籍 (Latest Updates)
 * @param limit 返回数量限制
 * @returns 书籍列表
 */
export async function getLatestBooks(limit: number = 12): Promise<Book[]> {
  try {
    const result = await pb.collection('books').getList<Book>(1, limit, {
      filter: 'status = "published"',
      sort: '-updated',
      expand: 'genres'
    });
    return JSON.parse(JSON.stringify(result.items)) as Book[];
  } catch (error) {
    console.error('获取最新书籍失败:', error);
    return [];
  }
}

/**
 * 根据 ID 获取单本书籍
 * @param bookId 书籍 ID
 * @returns 书籍对象或 null
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  try {
    // 在查询前检查管理员认证
    await ensureAdminAuth();
    
    const record = await pb.collection('books').getOne<Book>(bookId, {
      expand: 'genres'
    });
    return JSON.parse(JSON.stringify(record)) as Book;
  } catch (error) {
    console.error(`获取书籍 ${bookId} 失败:`, error);
    return null;
  }
}
