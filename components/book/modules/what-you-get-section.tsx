import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

interface WhatYouGetSectionProps {
  items: string[]
}

export default function WhatYouGetSection({ items }: WhatYouGetSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <Card id="what-you-get" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          What You'll Get
        </h2>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-base text-gray-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
