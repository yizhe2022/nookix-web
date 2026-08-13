import { createIdSlug } from "@/lib/slug-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Clock, Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface EmbeddedBookCardProps {
  title: string
  author: string
  rating: number
  duration: string
  cover: string
  bookId?: string
}



export default function EmbeddedBookCard({ title, author, rating, duration, cover, bookId = '1' }: EmbeddedBookCardProps) {
  return (
    <div className="flex justify-center">
      <Card className="w-[450px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex h-[120px]">
            {/* Book Cover */}
            <div className="relative w-[80px] h-[120px] flex-shrink-0">
              <Image src={cover || "/placeholder.svg"} alt={title} fill sizes="80px" className="object-fill rounded-l-lg" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-l-lg flex items-center justify-center group">
                <Button
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full p-0 bg-white/80 hover:bg-white"
                >
                  <Play className="w-3.5 h-3.5 text-gray-800 fill-current" />
                </Button>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <Link href={`/book/${bookId}`}>
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-tight transition-colors">
                    {title}
                  </h3>
                </Link>
                <p className="text-xs mb-2 text-gray-600">{author}</p>
              </div>

              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{duration}</span>
                </div>
                <div className="flex items-center text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                  <span>{rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
