"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Hash } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface Genre {
  id: string
  name: string
  slug?: string
  icon_emoji?: string
}

export default function ExploreGenres() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("genres")
          .select("id, name, slug, icon_emoji")
          .order("name", { ascending: true })

        if (error) throw error
        setGenres(data || [])
      } catch (error) {
        console.error("Failed to fetch genres:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGenres()
  }, [])

  if (isLoading) {
    return (
      <div className="mb-12 lg:mb-20">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (genres.length === 0) {
    return null
  }

  return (
    <div className="mb-12 lg:mb-20">
      <h3 className="flex items-center gap-2 text-xs sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-5 sm:mb-6">
        <Hash size={12} strokeWidth={2.5} />
        Deep Dive into Topics
      </h3>
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {genres.map((genre) => (
          <Link 
            key={genre.id} 
            href={`/dashboard/genre/${genre.slug || genre.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-[14px] font-medium text-slate-600 bg-white ring-1 ring-black/[0.06] hover:ring-blue-300 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm transition-all duration-200 cursor-pointer">
              {genre.icon_emoji && (
                <span className="text-base">{genre.icon_emoji}</span>
              )}
              {genre.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
