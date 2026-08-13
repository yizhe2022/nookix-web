import Link from 'next/link'
import { Button } from '@/components/ui/button'
import FeaturedBookSection from '@/components/home/featured-book-section'
import { getWebHomeFeaturedBooks } from '@/lib/supabase-service'

export default async function BookNotFound() {
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
    console.error('[Book 404 Page] Failed to fetch recommended books:', e)
  }

  return (
    <div className="bg-[#FCFAF7] min-h-screen">
      <div className="flex items-center justify-center px-4 pb-8 pt-20 sm:pb-10 sm:pt-24">
        <div className="mx-auto w-full max-w-md text-center">
          <h1 className="mb-3 text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mb-6 text-2xl font-semibold text-gray-800">Book Not Found</h2>
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/collections" className="w-full sm:w-auto">
              <Button className="w-full">
                Browse Collections
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                Back to Home
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