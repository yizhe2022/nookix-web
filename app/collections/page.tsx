import { getAllCollectionsPaginated } from "@/lib/supabase-service"
import CollectionsPageClient from "@/components/collections/collections-page-client"
import type { Metadata } from "next"
import { mergeMetadata } from "@/lib/seo-metadata"
import { toSiteUrl } from "@/lib/site-config"

const baseMetadata: Metadata = {
  title: "Good Audio Books: Top Ranked 60-Min Summaries | Nookix",
  description: "Browse curated collections of top ranked audio books for founders. We transform 300-page bestsellers into comprehensive 60-minute audio summaries with professional narration. Zero fluff.",
  alternates: {
    canonical: toSiteUrl('/collections'),
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return mergeMetadata('/collections', baseMetadata)
}

export default async function CollectionsPage() {
  // 从 Supabase 获取第一页 collections（SSR）
  let collectionsData: any[] = []
  let hasMore = false
  
  try {
    const data = await getAllCollectionsPaginated(1, 15)
    
    collectionsData = data.collections.map((collection: any) => {
      // 使用 allBooks 计算总时长（包含所有书籍）
      const allBooks = collection.allBooks || collection.books
      const totalSeconds = allBooks.reduce((sum: number, book: any) => {
        const duration = book.audio_duration || 0
        return sum + duration
      }, 0)
      const totalHours = (totalSeconds / 3600).toFixed(1) // 转换为小时，保留1位小数
      
      return {
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        tagline: collection.tagline || "Explore curated insights.",
        description: collection.description || "A curated collection of essential books.",
        totalBooks: collection.bookCount,
        totalDuration: `${totalHours} Hours`,
        coverUrl: collection.featured_image_url || collection.collection_cover_url || '/placeholder.svg',
        books: collection.books.slice(0, 3)
      }
    })
    
    hasMore = data.hasMore
  } catch (error) {
    console.error('Failed to fetch collections:', error)
  }

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Good Audio Books: Top Ranked 60-Min Summaries',
    description: 'Browse curated collections of top ranked audio books for founders. We transform 300-page bestsellers into comprehensive 60-minute audio summaries with professional narration.',
    url: toSiteUrl('/collections'),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Nookix',
      url: toSiteUrl('/')
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      
      <CollectionsPageClient 
        initialCollections={collectionsData}
        initialHasMore={hasMore}
      />
    </>
  )
}
