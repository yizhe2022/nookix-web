// Server Component — NO 'use client' directive intentionally.
// This component renders all static book content server-side so
// Google and other crawlers can index it without JavaScript.

import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Star, Calendar } from 'lucide-react'
import StarRating from '@/components/ui/star-rating'
import pb from '@/lib/pocketbase'
import { getFileUrl } from '@/lib/pocketbase-service'
import { getAuthorName } from '@/lib/author-utils'
import { formatDurationMinutes, formatRatingsCount } from '@/lib/format-utils'

// Import new module components (not used in this server component - only in BookDetailContent)

interface BookStaticContentProps {
    book: any
}

// Parse JSON array fields safely
function parseJsonArray(field: any): any[] {
    if (!field) return []
    if (Array.isArray(field)) return field
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field)
            return Array.isArray(parsed) ? parsed : [parsed]
        } catch {
            return [field]
        }
    }
    return []
}

function getBookCoverUrl(book: any): string {
    if (book?.cover_image) {
        try {
            const record = {
                ...book,
                collectionName: book.collectionName || 'books',
                collectionId: book.collectionId || '',
            }
            return getFileUrl(record, book.cover_image)
        } catch {
            return '/placeholder.svg'
        }
    }
    return '/placeholder.svg'
}

import { getSlugForGenre } from "@/lib/genre-slugs"

export default function BookStaticContent({ book }: BookStaticContentProps) {
    const authorName = getAuthorName(book)
    const coverUrl = getBookCoverUrl(book)
    const genres: any[] = Array.isArray(book.genres) ? book.genres : []
    
    // Parse new module data
    const whatYouWillGet = parseJsonArray(book.what_you_will_get)
    const targetAudience = parseJsonArray(book.target_audience)

    return (
        <>
            {/* Book Header — Cover, Title, Author, Rating, Genres - Separate from other modules */}
            <Card className="mt-1 shadow-none border-0 bg-transparent">
                <CardHeader className="px-0">
                    <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-6 lg:gap-8 lg:items-start">
                        {/* Book Cover */}
                        <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-[172px]">
                            <div className="relative bg-gray-100 rounded-2xl">
                                <Image
                                    src={coverUrl}
                                    alt={book.title ? `${book.title} Audio Book Summary Cover` : 'Nookix Audio Book Summary Cover'}
                                    width={172}
                                    height={258}
                                    className="w-[120px] h-[180px] md:w-[172px] md:h-[258px] rounded-2xl object-fill shadow-lg"
                                    sizes="(max-width: 768px) 120px, 172px"
                                    priority
                                    loading="eager"
                                />
                            </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                            <div className="mb-4">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 line-clamp-3 mb-2 md:mb-4">
                                    {book.title}
                                </h1>
                                {book.subtitle && (
                                    <h2 className="text-lg md:text-xl font-medium text-gray-600 mb-2 md:mb-4 line-clamp-2">
                                        {book.subtitle}
                                    </h2>
                                )}
                            </div>
                            <div>
                                <div className="text-base text-gray-600 mb-3">
                                    by {authorName}
                                </div>

                                {/* Duration & Rating — SSR rendered for crawlers */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-4 text-gray-600 text-sm">
                                        {book.rating > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="flex md:hidden items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                </div>
                                                <div className="hidden md:flex">
                                                    <StarRating rating={book.rating} showValue={false} />
                                                </div>
                                                <span className="font-medium text-gray-900">{book.rating}</span>
                                                {book.ratings_count > 0 && (
                                                    <span className="text-gray-500">({formatRatingsCount(book.ratings_count)} ratings)</span>
                                                )}
                                            </div>
                                        )}
                                        {book.audio_duration > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{formatDurationMinutes(book.audio_duration)}</span>
                                            </div>
                                        )}
                                        {book.publication_year && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{book.publication_year}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Genre badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {genres.length > 0 && genres.map((genre: any, index: number) => {
                                        const name = typeof genre === 'string'
                                            ? genre
                                            : (genre.name || genre.title || `Genre ${index + 1}`)
                                        return (
                                            <a key={index} href={`/genres/${getSlugForGenre(name)}`}>
                                                <Badge
                                                    variant="secondary"
                                                    className="cursor-pointer text-blue-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                                                >
                                                    {name}
                                                </Badge>
                                            </a>
                                        )
                                    })}
                                </div>

                                {/* Slot: Action Buttons (Client Interjected) */}
                                <div id="book-header-actions-portal" className="mb-0" />
                                
                                {/* Static fallback for non-JS users */}
                                <noscript>
                                    <a 
                                        href={`/dashboard/book/${book.slug}`}
                                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Listen Now
                                    </a>
                                </noscript>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </>
    )
}
