import BookGridLayout from "@/components/book/book-grid-layout"
import BookListLayout from "@/components/book/book-list-layout"
import BookAudioLayout from "@/components/book/book-audio-layout"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface SectionBookListProps {
  layout: "grid" | "list" | "audio"
  title: string
}

// Add breadcrumb component before the existing renderLayout function
const Breadcrumb = ({ title }: { title: string }) => (
  <div className="mb-8">
    <nav className="flex items-center space-x-2 text-sm">
      <Link href="/" className="text-gray-500 hover:text-blue-600 transition-colors">
        Home
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="text-gray-900 font-medium">{title}</span>
    </nav>
  </div>
)

export default function SectionBookList({ layout, title }: SectionBookListProps) {
  const renderLayout = () => {
    switch (layout) {
      case "grid":
        return <BookGridLayout />
      case "list":
        return <BookListLayout booksPerRow={2} />
      case "audio":
        return <BookAudioLayout />
      default:
        return <BookGridLayout />
    }
  }

  return (
    <section className="py-10 md:py-15" style={{ backgroundColor: "#fafbfc" }}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb title={title} />

        {renderLayout()}
      </div>
    </section>
  )
}
