import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCollectionBySlug } from "@/lib/supabase-service"
import DashboardCollectionDetailClient from "@/components/dashboard/dashboard-collection-detail-client"
import { formatDurationMinutes } from "@/lib/format-utils"

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.id
  
  const collectionData = await getCollectionBySlug(slug)
  
  if (!collectionData) {
    return {
      title: "Collection Not Found | Nookix Dashboard",
      description: "The requested collection could not be found."
    }
  }
  
  return {
    title: `${collectionData.title} | Nookix Dashboard`,
    description: collectionData.tagline || `Explore ${collectionData.title} collection`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function DashboardCollectionDetailPage({ params }: CollectionDetailPageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.id
  
  const collectionData = await getCollectionBySlug(slug)
  
  if (!collectionData) {
    notFound()
  }

  const books = collectionData.books || []
  
  // 计算总时长
  const totalSeconds = books.reduce((sum: number, book: any) => {
    if (book.audio_duration) {
      const duration = typeof book.audio_duration === 'number' 
        ? book.audio_duration 
        : parseInt(book.audio_duration) || 0
      return sum + duration
    }
    return sum
  }, 0)
  const totalDuration = formatDurationMinutes(totalSeconds)
  
  const collection = {
    id: collectionData.id,
    title: collectionData.title,
    subtitle: collectionData.tagline || "",
    curatorNote: collectionData.description || "A curated collection of essential books.",
    totalBooks: books.length,
    totalDuration,
    coverUrl: collectionData.featured_image_url || collectionData.collection_cover_url || '/placeholder.svg',
    books: books.map(book => {
      const duration = typeof book.audio_duration === 'number'
        ? book.audio_duration
        : parseInt(book.audio_duration || '0') || 0
      const audioDuration = formatDurationMinutes(duration)

      return {
        id: book.id,
        title: book.title,
        author: (book.authors || "Unknown Author") as string,
        coverUrl: book.cover_image || '/placeholder.svg',
        audioDuration,
        ratingsCount: (book as any).ratings_count || 0,
        oneLiner: (book as any).one_liner || "Discover key insights from this book.",
        audioFile: (book as any).summary_audio || null,
        isPremium: (book as any).is_premium || false,
        slug: (book as any).slug,
      }
    })
  }

  return <DashboardCollectionDetailClient collection={collection} />
}
