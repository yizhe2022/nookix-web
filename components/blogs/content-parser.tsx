
import React from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import BookEmbedder from "./book-embedder"

interface ContentParserProps {
  content: string
}

type ContentToken =
  | { type: "markdown"; value: string }
  | { type: "book"; slug: string; layout: string; index: number }
  | { type: "books"; slugs: string[]; layout: string; index: number }
  | { type: "youtube"; url: string; index: number }

const shortcodeRegex = /\[(book):([^\]\s]+)\]|\[(books):([a-z]+):([^\]]+)\]|\[(youtube):(https?:\/\/[^\]]+)\]/g

const toContentTokens = (content: string): ContentToken[] => {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  const tokens: ContentToken[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = shortcodeRegex.exec(normalized)) !== null) {
    const before = normalized.slice(lastIndex, match.index).trim()

    if (before) {
      tokens.push({ type: "markdown", value: before })
    }

    if (match[1] === "book") {
      tokens.push({ type: "book", slug: match[2].trim(), layout: "list", index: match.index })
    }

    if (match[3] === "books") {
      tokens.push({
        type: "books",
        layout: match[4] || "list",
        slugs: match[5].split(",").map(slug => slug.trim()).filter(Boolean),
        index: match.index,
      })
    }

    if (match[6] === "youtube") {
      tokens.push({ type: "youtube", url: match[7].trim(), index: match.index })
    }

    lastIndex = match.index + match[0].length
  }

  const after = normalized.slice(lastIndex).trim()
  if (after) {
    tokens.push({ type: "markdown", value: after })
  }

  return tokens
}

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    const host = parsedUrl.hostname.replace(/^www\./, "")

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || null
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsedUrl.pathname === "/watch") return parsedUrl.searchParams.get("v")
      if (parsedUrl.pathname.startsWith("/embed/") || parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/").filter(Boolean)[1] || null
      }
    }

    return null
  } catch {
    return null
  }
}

const MarkdownContent = ({ value }: { value: string }) => (
  <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-slate-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {value}
    </ReactMarkdown>
  </div>
)

const YouTubeEmbed = ({ url }: { url: string }) => {
  const videoId = getYouTubeVideoId(url)

  if (!videoId) return null

  return (
    <div className="my-8 mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-video w-full bg-slate-100">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default function ContentParser({ content }: ContentParserProps) {
  if (!content) {
    return (
      <div className="text-gray-500 italic">
        No content available for this series.
      </div>
    )
  }

  const tokens = toContentTokens(content)

  return (
    <div className="space-y-0">
      {tokens.map((token, index) => {
        if (token.type === "markdown") {
          return <MarkdownContent key={`content-${index}`} value={token.value} />
        }

        if (token.type === "book") {
          return (
            <div key={`book-${token.slug}-${index}`} className="my-8">
              <BookEmbedder bookId={token.slug} layout="list" />
            </div>
          )
        }

        if (token.type === "books") {
          const gridClass = token.layout === "focus" || token.layout === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6 my-8"
            : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-8"

          return (
            <div key={`books-${token.index}-${index}`} className={gridClass}>
              {token.slugs.map((slug, slugIndex) => (
                <BookEmbedder
                  key={`${slug}-${slugIndex}`}
                  bookId={slug}
                  layout={token.layout}
                />
              ))}
            </div>
          )
        }

        return <YouTubeEmbed key={`youtube-${token.index}-${index}`} url={token.url} />
      })}
    </div>
  )
}
