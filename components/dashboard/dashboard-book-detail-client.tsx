"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Clock, Star, Play, Plus, Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import BookCardWeb from "./book-card-web"
import { useAuth } from "@/contexts/auth-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { isBookInLibrary, toggleBookInLibrary } from "@/lib/library-service"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { formatDurationMinutes } from "@/lib/format-utils"

interface DashboardBookDetailClientProps {
  book: any
  relatedBooks: any[]
}

export default function DashboardBookDetailClient({ book, relatedBooks }: DashboardBookDetailClientProps) {
  const { user } = useAuth()
  const { playBook } = useAudioPlayer()
  const { toast } = useToast()
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isTogglingLibrary, setIsTogglingLibrary] = useState(false)
  const [isCheckingLibrary, setIsCheckingLibrary] = useState(true)

  // 检查书本是否在图书馆
  useState(() => {
    const checkLibraryStatus = async () => {
      if (!user) {
        setIsCheckingLibrary(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          setIsCheckingLibrary(false)
          return
        }

        const result = await isBookInLibrary(book.id)
        setIsInLibrary(result)
      } catch (error) {
        console.error("Failed to check library status:", error)
      } finally {
        setIsCheckingLibrary(false)
      }
    }

    checkLibraryStatus()
  })

  const handleToggleLibrary = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to add books to your library",
        variant: "destructive",
      })
      return
    }

    setIsTogglingLibrary(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error("No access token")
      }

      const result = await toggleBookInLibrary(book.id)
      
      if (result.success) {
        setIsInLibrary(result.isInLibrary)
        toast({
          title: result.isInLibrary ? "Added to library" : "Removed from library",
          description: result.isInLibrary 
            ? `"${book.title}" has been added to your library` 
            : `"${book.title}" has been removed from your library`,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update library",
        variant: "destructive",
      })
    } finally {
      setIsTogglingLibrary(false)
    }
  }

  const handlePlay = () => {
    playBook(book)
  }

  const getCoverUrl = (coverImage: string) => {
    if (!coverImage) return "/placeholder.svg"
    if (coverImage.startsWith("http")) return coverImage
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/book-covers/${coverImage}`
  }

  const formatDuration = (seconds?: number) => formatDurationMinutes(seconds)

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link href="/dashboard/for-you" className="hover:text-gray-900 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/dashboard/explore" className="hover:text-gray-900 transition-colors">
          Explore
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium line-clamp-1">{book.title}</span>
      </nav>

      {/* 书本信息区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* 左侧：封面 */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="relative aspect-[2/3] w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={getCoverUrl(book.cover_image)}
                alt={book.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* 右侧：书本信息 */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{book.authors}</p>
            
            {/* 评分和时长 */}
            <div className="flex items-center gap-6 mb-6">
              {book.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold text-gray-900">{book.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(book.audio_duration)}</span>
              </div>
            </div>

            {/* 简介 */}
            {book.one_liner && (
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {book.one_liner}
              </p>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={handlePlay}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Play Now
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleToggleLibrary}
                disabled={isTogglingLibrary || isCheckingLibrary}
              >
                {isInLibrary ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    In Library
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Library
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 详细描述 */}
          {book.description && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this book</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popular Books 推荐 */}
      {relatedBooks.length > 0 && (
        <div className="border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Books</h2>
          
          {/* 移动端：网格布局 */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            {relatedBooks.slice(0, 6).map((relatedBook) => (
              <BookCardWeb key={relatedBook.id} book={relatedBook} />
            ))}
          </div>

          {/* 桌面端：横向滚动 */}
          <div className="hidden lg:block overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 pb-4">
              {relatedBooks.map((relatedBook) => (
                <div key={relatedBook.id} className="flex-shrink-0 w-[170px]">
                  <BookCardWeb book={relatedBook} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
