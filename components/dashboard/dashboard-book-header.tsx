"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Star, Headphones, Bookmark, Loader2, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import { Card, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { isBookInLibrary, toggleBookInLibrary } from "@/lib/library-service"
import { getFileUrl } from "@/lib/pocketbase-service"
import { getAuthorName } from "@/lib/author-utils"
import { getSlugForGenre } from "@/lib/genre-slugs"
import { formatDurationMinutes, formatRatingsCount } from "@/lib/format-utils"

interface DashboardBookHeaderProps {
  book: any
  onPlayNow: () => void
  onOpenReader: () => void
}

export default function DashboardBookHeader({ book, onPlayNow, onOpenReader }: DashboardBookHeaderProps) {
  const { user } = useAuth()
  const { isPlaying } = useAudioPlayer()
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isTogglingLibrary, setIsTogglingLibrary] = useState(false)
  const [isCheckingLibrary, setIsCheckingLibrary] = useState(true)

  const authorName = getAuthorName(book)
  const genres: any[] = Array.isArray(book.genres) ? book.genres : []

  const getCoverUrl = () => {
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

  // 检查书本是否在图书馆
  useEffect(() => {
    const checkLibraryStatus = async () => {
      if (!user) {
        setIsCheckingLibrary(false)
        return
      }

      try {
        const result = await isBookInLibrary(book.id)
        setIsInLibrary(result)
      } catch (error) {
        console.error("Failed to check library status:", error)
      } finally {
        setIsCheckingLibrary(false)
      }
    }

    checkLibraryStatus()
  }, [user, book.id])

  const handleToggleLibrary = async () => {
    if (!user) {
      // 可以添加登录提示
      return
    }

    setIsTogglingLibrary(true)

    try {
      const result = await toggleBookInLibrary(book.id)
      
      if (result.success) {
        setIsInLibrary(result.isInLibrary)
      }
    } catch (error: any) {
      console.error("Failed to toggle library:", error)
    } finally {
      setIsTogglingLibrary(false)
    }
  }

  return (
    <Card className="mt-1 shadow-none border-0 bg-transparent">
      <CardHeader className="px-0">
        <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-6 lg:gap-8 lg:items-start">
          {/* Book Cover */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start lg:w-[172px]">
            <div className="relative bg-gray-100 rounded-2xl">
              <Image
                src={getCoverUrl()}
                alt={book.title ? `${book.title} Audio Book Summary Cover` : 'Nookix Audio Book Summary Cover'}
                width={172}
                height={258}
                className="w-[120px] h-[180px] md:w-[172px] md:h-[258px] rounded-2xl object-fill shadow-lg"
                sizes="(max-width: 768px) 120px, 172px"
                priority
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

              {/* Rating & Duration */}
              <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
                {book?.rating && (
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
                {book?.audio_duration > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatDurationMinutes(book.audio_duration)}</span>
                  </div>
                )}
                {book?.publication_year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{book.publication_year}</span>
                  </div>
                )}
              </div>

              {/* Genre badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {genres.length > 0 && genres.map((genre: any, index: number) => {
                  const name = typeof genre === 'string'
                    ? genre
                    : (genre.name || genre.title || `Genre ${index + 1}`)
                  return (
                    <Link key={index} href={`/dashboard/genre/${getSlugForGenre(name)}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer text-blue-600 bg-gray-100 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                      >
                        {name}
                      </Badge>
                    </Link>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={onPlayNow}
                >
                  <Headphones className="h-4 w-4 mr-2" />
                  Start Listening
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full md:w-auto text-gray-900 border-gray-300 hover:bg-gray-50" 
                  onClick={onOpenReader}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Read Transcript
                </Button>
                
                {user && (
                  <Button 
                    variant="outline" 
                    className={`w-full md:w-auto border-gray-300 hover:bg-gray-50 ${
                      isInLibrary 
                        ? 'text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100' 
                        : 'text-gray-900'
                    }`}
                    onClick={handleToggleLibrary}
                    disabled={isTogglingLibrary || isCheckingLibrary}
                  >
                    {isTogglingLibrary ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isInLibrary ? 'Saving...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Bookmark 
                          className={`h-4 w-4 mr-2 ${isInLibrary ? 'fill-blue-600' : ''}`}
                        />
                        {isInLibrary ? 'In Library' : 'Save to Library'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
