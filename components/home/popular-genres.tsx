import Link from "next/link"
import { Hash } from "lucide-react"
import { getAllGenres } from "@/lib/supabase-service"

export default async function PopularGenres() {
  const genres = await getAllGenres()

  if (!genres || genres.length === 0) {
    return null
  }

  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        <h3 className="flex items-center gap-2 text-xs sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-5 sm:mb-6">
          <Hash size={12} strokeWidth={2.5} />
          Deep Dive into Topics
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {genres.map((genre) => (
            <Link key={genre.id} href={`/genres/${genre.slug || genre.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
    </section>
  )
}
