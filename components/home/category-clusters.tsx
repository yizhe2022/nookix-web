import { createIdSlug } from "@/lib/slug-utils"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Hash, Compass } from "lucide-react"
import { getAllCollections, getAllGenres } from "@/lib/supabase-service"

interface Genre {
  id: string
  name: string
  slug?: string
  icon_emoji?: string
}

interface Collection {
  id: string
  title: string
  slug: string
  tagline: string
  description: string
  collection_cover_url: string
  featured_image_url: string
}

// 预设兜底图：当接口图片失效时，防止页面出现难看的裂图
const defaultCovers = [
  "/images/hero_cover.webp",
  "/images/premium_hero.jpg",
  "/images/miracle_morning.webp",
  "/images/blog-section-example.png",
]

export default async function CategoryClusters() {
  // 从 Supabase 获取 collections 和 genres
  const collections = await getAllCollections()
  const genres = await getAllGenres()
  
  const displaySections = collections.slice(0, 4).map((collection, index) => {
    // 使用 featured_image_url 或 collection_cover_url
    const coverUrl = collection.featured_image_url || collection.collection_cover_url || defaultCovers[index % defaultCovers.length]

    return {
      id: collection.id,
      title: collection.title,
      subtitle: collection.tagline || collection.description || "Explore curated insights.",
      coverUrl,
      bookCount: 0, // 这里可以后续优化，从 collection_books 表统计
      href: `/collections/${collection.slug}`
    }
  })

  return (
    <section className="bg-[#FAFAF9] py-10 sm:py-14 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* === 区域 1：核心 Book Sections === */}
        <div className="mb-12 sm:mb-16">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ring-1 ring-blue-200/60 bg-blue-50 mb-4 sm:mb-5">
                <Compass size={12} className="text-blue-600" />
                <span className="text-xs font-semibold tracking-widest uppercase text-blue-600">
                  Curated Collections
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15] whitespace-nowrap">
                Best Audio Books of All Time
              </h2>
            </div>
            <Link
              href="/collections"
              className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-slate-500 hover:text-blue-600 transition-colors duration-200 group"
            >
              Browse all collections
              <ArrowRight size={14} className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displaySections.map((category) => (
              <Link key={category.id} href={category.href} className="group outline-none rounded-[20px]">
                {/* 卡片主容器：极轻微阴影，悬浮上浮 */}
                <div className="relative h-full overflow-hidden rounded-[20px] bg-white ring-1 ring-black/[0.05] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.1)] hover:ring-black/[0.08] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col">

                  {/* --- 图片横幅区 (复刻图 3 样式) --- */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-50 border-b border-black/[0.03]">
                    <Image
                      src={category.coverUrl}
                      alt={category.title}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* 文字内容区 */}
                  <div className="flex flex-col flex-1 p-4 sm:p-5">
                    <h3 className="text-base sm:text-[18px] font-bold tracking-tight text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors duration-200 leading-snug">
                      {category.title}
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-slate-500 leading-relaxed mb-4 sm:mb-6 line-clamp-2 font-medium">
                      {category.subtitle}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold tracking-wide text-slate-400 group-hover:text-blue-600 transition-colors duration-200">
                        Explore collection
                        <ArrowRight size={13} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </div>
                      {/* 右下角书籍数量角标 */}
                      {category.bookCount > 0 && (
                        <div className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-md bg-slate-50 ring-1 ring-black/[0.04]">
                          <span className="text-xs sm:text-[11px] font-bold text-slate-600 tracking-tight">
                            {category.bookCount} Books
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* === 区域 2：细分 Genres 标签云 === */}
        {genres && genres.length > 0 && (
          <div className="pt-6 sm:pt-8">
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
        )}
      </div>
    </section>
  )
}
