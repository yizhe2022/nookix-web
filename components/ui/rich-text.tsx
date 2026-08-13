import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

interface RichTextProps {
  content?: string | null
  className?: string
}

export default function RichText({ content, className }: RichTextProps) {
  if (!content) return null

  return (
    <div className={className || "prose prose-base max-w-none text-gray-700 leading-relaxed"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}