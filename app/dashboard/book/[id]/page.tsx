import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBookBySlug, getRelatedBooksByPrimaryGenre, getPopularBooks } from "@/lib/supabase-service"
import DashboardBookDetailWrapper from "@/components/dashboard/dashboard-book-detail-wrapper"

interface BookDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.id
    const book = await getBookBySlug(slug)
    
    if (!book) {
      return {
        title: "Book Not Found | Nookix Dashboard",
      }
    }

    return {
      title: `${book.title} | Nookix Dashboard`,
      description: book.one_liner || book.description || `Read ${book.title} on Nookix`,
      robots: {
        index: false,
        follow: false,
      },
    }
  } catch (error) {
    return {
      title: "Book Detail | Nookix Dashboard",
    }
  }
}

export default async function DashboardBookDetailPage({ params }: BookDetailPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.id
  
  console.log('📖 [Dashboard Book Detail] Loading book with slug:', slug)
  
  // 获取书本详情（使用 slug）
  const book = await getBookBySlug(slug)
  
  console.log('📖 [Dashboard Book Detail] Book data:', book ? 'Found' : 'Not found')
  
  if (!book) {
    console.warn('⚠️ [Dashboard Book Detail] Book not found, redirecting to 404')
    notFound()
  }

  // 获取相关推荐（Popular Books）
  const primaryGenre = book.genres?.find((g: any) => g.sort_order === 0) || book.genres?.[0]
  let relatedBooks: any[] = []
  
  if (primaryGenre) {
    relatedBooks = await getRelatedBooksByPrimaryGenre(book.id, primaryGenre.id, 10)
  }
  
  // 如果相关书籍不足，补充热门书籍
  if (relatedBooks.length < 4) {
    const popularBooks = await getPopularBooks(10)
    const excludeIds = new Set([book.id, ...relatedBooks.map(b => b.id)])
    const additionalBooks = popularBooks.filter(b => !excludeIds.has(b.id))
    relatedBooks = [...relatedBooks, ...additionalBooks].slice(0, 10)
  }

  // 准备 genres 数据用于 Related Topics 模块
  const genres = book.genres?.map((g: any) => ({
    title: g.name,
    slug: g.slug,
    icon_emoji: g.icon_emoji
  })) || []

  const clientBook = process.env.NODE_ENV === 'production'
    ? { ...book, summary_audio: null }
    : book

  // 使用包装器组件，内部使用官网的 BookDetailContent
  return (
    <DashboardBookDetailWrapper
      bookId={book.id}
      initialBook={clientBook}
      initialRelatedBooks={relatedBooks}
      popularBooks={relatedBooks}
      genres={genres}
    />
  )
}
