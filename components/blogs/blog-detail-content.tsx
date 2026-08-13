import Link from "next/link"
import ContentParser from "./content-parser"
import { tagToSlug } from '@/lib/slug-utils'

interface BlogDetailContentProps {
  blog: {
    id: string
    title: string
    publishDate: string
    bookCount: number
    image: string
    content: string
    description?: string
    status?: string
    tags?: string[]
  }
}

export default function BlogDetailContent({ blog }: BlogDetailContentProps) {
  // 格式化发布日期
  const formattedDate = new Date(blog.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <article className="space-y-6 sm:space-y-8">
      {/* Title Section */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {blog.title}
        </h1>
        {/* Publish Date */}
        <p className="text-sm text-slate-500 font-medium">
          Published on {formattedDate}
        </p>
      </div>

      {/* Blog Content with Embedded Books */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 ring-1 ring-black/[0.04] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)]">
        <ContentParser content={blog.content || blog.description || ""} />
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {blog.tags.map((tag, index) => (
            <Link key={index} href={`/blog/${tagToSlug(tag)}`}>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer">
                # {tag}
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  )
}
