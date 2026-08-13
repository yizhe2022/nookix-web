import Link from "next/link"
import Image from "next/image"
import { Clock, Compass } from "lucide-react"
import { formatRatingsCount } from "@/lib/format-utils"

interface Book {
  id: string
  title: string
  author?: string
  authors?: string  // authors 是文本字段，不是数组
  coverUrl?: string
  duration?: string
  rating?: number
  ratingsCount?: number  // 新增评分数量字段
  slug?: string
  expand?: {
    author?: any[]  // 展开的作者数据
  }
}

interface FeaturedSectionProps {
  sectionTitle: string
  sectionSubtitle: string
  books: Book[]
  variant?: 'default' | 'compact'
}

export default function FeaturedBookSection({ sectionTitle, sectionSubtitle, books, variant = 'default' }: FeaturedSectionProps) {
  if (!books || books.length === 0) return null;

  const isCompact = variant === 'compact'

  return (
    <section className={`relative overflow-hidden bg-[#FAFAF9] ${isCompact ? 'py-8 sm:py-10' : 'py-12 sm:py-16 lg:py-16'}`}>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-8 lg:px-12">

        <div className={isCompact ? 'mb-6' : 'mb-12 flex flex-col gap-6 sm:mb-16 sm:flex-row sm:items-end sm:justify-between'}>
          <div className="max-w-xl">
            {!isCompact && (
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 ring-1 ring-blue-200/60">
                <Compass size={12} className="text-blue-600" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                  Featured Books
                </span>
              </div>
            )}
            <h2 className={isCompact
              ? 'text-2xl font-semibold text-slate-900'
              : 'text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]'
            }>
              {sectionTitle}
            </h2>
          </div>
        </div>

        {/* Book Cards Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-5">
          {books.slice(0, 6).map((book, index) => {
            // 获取作者名称
            const getAuthorName = (book: Book): string => {
              // 优先使用 authors 文本字段
              if (book.authors && typeof book.authors === 'string' && book.authors.trim()) {
                return book.authors
              }
              // 其次使用 expand.author
              if (book.expand?.author && Array.isArray(book.expand.author) && book.expand.author.length > 0) {
                return book.expand.author[0].name || 'Unknown Author'
              }
              // 最后使用 author 字段
              if (book.author) {
                return Array.isArray(book.author) 
                  ? (book.author[0]?.name || book.author[0] || 'Unknown Author')
                  : book.author
              }
              return 'Unknown Author'
            }

            return (
              <Link key={book.id} href={`/book/${book.slug}`} className="group outline-none">
                <div className="flex flex-col">

                  {/* Cover Wrapper */}
                  <div className="relative mb-4">
                    {/* 书封底部的轻微扩散射影（Hover 时显现） - 添加圆角 */}
                    <div className="absolute -inset-2 rounded-[20px] bg-slate-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div
                      className={[
                        "relative aspect-[2/3] overflow-hidden rounded-xl bg-slate-100",
                        "ring-1 ring-black/[0.04]",
                        "shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)]",
                        "transition-all duration-500 ease-out",
                        "group-hover:-translate-y-1.5",
                        "group-hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] group-hover:ring-black/[0.08]",
                      ].join(" ")}
                    >
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          fill
                          unoptimized
                          priority={index < 2}
                          loading={index < 2 ? undefined : "lazy"}
                          className="object-cover transition-all duration-700 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 16vw, 200px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                          No Cover
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta Text */}
                  <div className="px-1 relative z-10 space-y-2">
                    {/* 书名 */}
                    <h3 className="line-clamp-2 text-balance text-[14px] font-bold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-[15px]">
                      {book.title}
                    </h3>
                    
                    {/* 作者名 */}
                    <p className="line-clamp-1 text-[13px] font-medium text-slate-600">
                      {getAuthorName(book)}
                    </p>

                    {/* 时长和评分 - 移动端只显示时长 */}
                    <div className="flex items-center justify-between">
                      {/* 评分数量 - 移动端隐藏 */}
                      {book.ratingsCount !== undefined && book.ratingsCount > 0 && (
                        <div className="hidden sm:flex items-center">
                          <span className="text-xs" style={{ color: "#939999" }}>
                            {formatRatingsCount(book.ratingsCount)} ratings
                          </span>
                        </div>
                      )}
                      
                      {/* 时长 */}
                      <div className="flex items-center text-xs" style={{ color: "#939999" }}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{book.duration || "30min"}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}
