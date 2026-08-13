import { Metadata } from "next"
import { getAllCollectionsPaginated } from "@/lib/supabase-service"
import DashboardCollectionsClient from "@/components/dashboard/dashboard-collections-client"
import { formatDurationMinutes } from "@/lib/format-utils"

export const metadata: Metadata = {
  title: "Collections | Nookix Dashboard",
  description: "Browse curated collections of audio books",
  robots: {
    index: false,
    follow: false,
  },
}

// 启用 ISR: 30 分钟重新生成一次
export const revalidate = 1800

interface Book {
  id: string
  title: string
  cover_image: string
  audio_duration: number
}

interface Collection {
  id: string
  title: string
  slug: string
  tagline: string
  description: string
  collection_cover_url: string
  featured_image_url: string
  books: Book[]
  bookCount: number
}

export default async function DashboardCollectionsPage() {
  let collectionsData: any[] = []
  let hasMore = false
  
  try {
    const data = await getAllCollectionsPaginated(1, 15)
    
    collectionsData = data.collections.map((collection: any) => {
      const allBooks = collection.allBooks || collection.books
      const totalSeconds = allBooks.reduce((sum: number, book: any) => {
        const duration = book.audio_duration || 0
        return sum + duration
      }, 0)
      const totalDuration = formatDurationMinutes(totalSeconds)
      
      return {
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        tagline: collection.tagline || "Explore curated insights.",
        description: collection.description || "A curated collection of essential books.",
        totalBooks: collection.bookCount,
        totalDuration,
        coverUrl: collection.featured_image_url || collection.collection_cover_url || '/placeholder.svg',
        books: collection.books.slice(0, 3)
      }
    })
    
    hasMore = data.hasMore
  } catch (error) {
    console.error('Failed to fetch collections:', error)
  }

  return <DashboardCollectionsClient collections={collectionsData} hasMore={hasMore} />
}
