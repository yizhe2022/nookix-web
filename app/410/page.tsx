import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Home, BookOpen } from 'lucide-react'
import FeaturedBookSection from '@/components/home/featured-book-section'
import { getWebHomeFeaturedBooks } from '@/lib/supabase-service'

export const metadata: Metadata = {
  title: 'Content Removed | Nookix',
  description: 'This content has been permanently removed.',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * 410 Gone page
 * For permanently deleted content
 */
export default async function GonePage() {
  // 获取推荐书籍
  let recommendedBooks: any[] = []
  try {
    const result = await getWebHomeFeaturedBooks()
    if (result && result.books.length > 0) {
      recommendedBooks = result.books.map((book: any) => ({
        id: book.id,
        title: book.title,
        slug: book.slug,
        authors: book.authors,
        coverUrl: book.cover_image || undefined,
        duration: book.audio_duration ? `${Math.round(book.audio_duration / 60)}min` : '30min',
        rating: 0,
        ratingsCount: 0,
      }))
    }
  } catch (e) {
    console.error('[410 Page] Failed to fetch recommended books:', e)
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
      <div className="flex items-center justify-center px-4 pb-8 pt-20 sm:pb-10 sm:pt-24">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="text-9xl font-bold text-gray-300">410</div>
            <div className="mt-3 text-2xl font-semibold text-gray-700">Content Permanently Removed</div>
          </div>

          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Return to Homepage
              </Button>
            </Link>

            <Link href="/collections" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full" size="lg">
                <BookOpen className="mr-2 h-4 w-4" />
                Explore Collections
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Books Section */}
      {recommendedBooks.length > 0 && (
        <FeaturedBookSection
          sectionTitle="Books You Might Like"
          sectionSubtitle="Explore our curated collection"
          books={recommendedBooks}
          variant="compact"
        />
      )}
    </div>
  )
}