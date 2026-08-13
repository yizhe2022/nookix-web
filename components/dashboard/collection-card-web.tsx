"use client"

import { memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen } from "lucide-react"

interface CollectionCardWebProps {
  collection: {
    id: string
    title: string
    slug?: string
    collection_cover_url?: string
    book_count?: number
  }
}

const CollectionCardWeb = memo(({ collection }: CollectionCardWebProps) => {
  const collectionPath = collection.slug || collection.id
  const collectionUrl = `/dashboard/collection/${collectionPath}`
  
  const getCoverUrl = (coverUrl?: string) => {
    if (!coverUrl) return "/placeholder.svg"
    if (coverUrl.startsWith("http")) return coverUrl
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collection-covers/${coverUrl}`
  }

  return (
    <Link href={collectionUrl} className="block group">
      <div className="flex flex-col">
        {/* Collection 封面 - 正方形 */}
        <div className="relative mb-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:ring-black/[0.08]">
            <Image
              src={getCoverUrl(collection.collection_cover_url)}
              alt={collection.title || "Collection cover"}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
              className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
            />
          </div>
        </div>

        {/* Collection 信息 */}
        <div className="px-1 space-y-2">
          {/* Collection 标题 */}
          <h3 className="line-clamp-2 text-balance text-[14px] font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[15px]">
            {collection.title}
          </h3>
          
          {/* 书本数量 */}
          {collection.book_count !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                {collection.book_count} {collection.book_count === 1 ? "book" : "books"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})

CollectionCardWeb.displayName = "CollectionCardWeb"

export default CollectionCardWeb
