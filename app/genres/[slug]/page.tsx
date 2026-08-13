import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getGenreWithBooksPaginated } from "@/lib/supabase-service"
import GenrePageClient from "@/components/genre/genre-page-client"
import { mergeMetadata } from "@/lib/seo-metadata"
import { SITE_URL, toSiteUrl } from "@/lib/site-config"

// 使用 Next.js 15 兼容的类型定义
interface GenrePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { slug } = await params
  const path = `/genres/${slug}`
  const genreData = await getGenreWithBooksPaginated(slug, 1, 24)

  if (!genreData) {
    return mergeMetadata(path, {
      title: "Genre Not Found | Nookix",
      description: "The requested genre could not be found.",
    })
  }

  const { genre } = genreData

  // 优先使用自定义 SEO 字段，否则使用模板化生成
  const metaTitle = (genre as any).seo_title || `Best Audio Book Summaries for ${genre.name} | Nookix`
  const metaDescription = (genre as any).seo_description || `Explore best audio book summaries in ${genre.name}. Get key insights from top titles in 60 mins. The best Blinkist alternative for ${genre.name} fans.`

  return mergeMetadata(path, {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: toSiteUrl(`/genres/${slug}`),
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

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params

  // 从 Supabase 获取第一页数据（SSR）
  const genreData = await getGenreWithBooksPaginated(slug, 1, 24)

  if (!genreData) {
    notFound()
  }

  const { genre, books, hasMore } = genreData

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: toSiteUrl('/')
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Genres',
        item: toSiteUrl('/genres')
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: genre.name,
        item: toSiteUrl(`/genres/${slug}`)
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      
      <GenrePageClient 
        initialGenre={genre}
        initialBooks={books}
        initialHasMore={hasMore}
        slug={slug}
      />
    </>
  )
} 