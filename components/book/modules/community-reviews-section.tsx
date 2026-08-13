import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Quote } from 'lucide-react'

interface CommunityReview {
  summary: string
  rating?: number
}

interface CommunityReviewsSectionProps {
  reviews: (string | CommunityReview)[]
}

export default function CommunityReviewsSection({ reviews }: CommunityReviewsSectionProps) {
  if (!reviews || reviews.length === 0) return null

  // 只显示前 3 条评论
  const displayReviews = reviews.slice(0, 3)

  return (
    <Card id="community-highlights" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          Community Highlights
        </h2>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {displayReviews.map((review, index) => {
            // 支持两种格式：字符串或对象
            const reviewText = typeof review === 'string' ? review : review.summary
            
            return (
              <div 
                key={index} 
                className="flex gap-3 items-start p-4 bg-amber-50 rounded-lg border border-amber-100"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <Quote className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-gray-700 leading-relaxed flex-1 text-base">
                  "{reviewText}"
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
