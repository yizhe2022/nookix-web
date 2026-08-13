"use client"

import { Badge } from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import { Play, Clock, Crown, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import pb from "@/lib/pocketbase"
import { getFileUrl } from "@/lib/pocketbase-service"
import { getAuthorName } from '@/lib/author-utils'

interface BookGridProps {
  books: any[];
  loading?: boolean;
  onDelete?: (libraryItemId: string, bookTitle: string) => void;
  showProgress?: boolean;
}

export default function BookGrid({ books, loading, showProgress = false }: BookGridProps) {
  const [booksWithDuration, setBooksWithDuration] = useState<any[]>([]);

  // 处理书本时长
  useEffect(() => {
    if (!books || books.length === 0) {
      setBooksWithDuration([]);
      return;
    }

    // 直接处理时长，使用 audio_duration 字段
    const processBooks = () => {
      try {
        const processedBooks = books.map((book) => {
          // 使用 PocketBase 的 audio_duration 字段
          let calculatedDuration = 'Unknown';

          if (book.audio_duration && book.audio_duration > 0) {
            calculatedDuration = `${Math.ceil(book.audio_duration / 60)}min`;
          }

          return {
            ...book,
            calculatedDuration
          };
        });

        setBooksWithDuration(processedBooks);
      } catch (error) {
        console.error('处理书本时长失败:', error);
        // 如果处理失败，设置默认时长
        setBooksWithDuration(books.map(book => ({ ...book, calculatedDuration: 'Unknown' })));
      }
    };

    processBooks();
  }, [books]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-[2/3] mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!booksWithDuration || booksWithDuration.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found in your library.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {booksWithDuration.map((book) => (
        <Link key={book.id} href={`/book/${book.slug}`} className="group cursor-pointer">
          <div>
            <div className="relative">
              {/* 书本封面 */}
              <div className="relative aspect-[2/3] mb-3 rounded-lg overflow-hidden shadow-sm">
                <Image
                  src={book.cover && typeof book.cover === 'string' && book.cover.trim() !== '' ? getFileUrl({ id: book.bookId || book.id, collectionId: book.collectionId }, book.cover, '300x450') : "/placeholder.svg"}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                  className="object-fill"
                  priority={false}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <Play className="w-6 h-6 text-gray-600 fill-current" />
                  </div>
                </div>

                {/* 进度标签 - 右下角 */}
                {showProgress && book.progress !== undefined && book.progress !== null && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg">
                    {Math.round(book.progress)}%
                  </div>
                )}
              </div>

            </div>

            {/* 书本信息 */}
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-900 transition-colors book-title-focus">
                {book.title}
              </h3>

              <p className="text-xs line-clamp-1" style={{ color: "#939999" }}>{getAuthorName(book)}</p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center text-xs" style={{ color: "#939999" }}>
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    {book.duration && book.duration !== 'N/A' && book.duration !== 'Unknown'
                      ? book.duration
                      : book.calculatedDuration || 'Unknown'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs" style={{ color: "#939999" }}>{typeof book.rating === 'number' ? book.rating.toFixed(1) : (book.rating || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}