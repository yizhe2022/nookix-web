import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Users } from 'lucide-react'

interface TargetAudienceSectionProps {
  audience: string[]
}

export default function TargetAudienceSection({ audience }: TargetAudienceSectionProps) {
  if (!audience || audience.length === 0) return null

  return (
    <Card id="who-should-listen" className="mb-0 md:mb-6 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          Who Should Listen?
        </h2>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          {audience.map((item, index) => (
            <div 
              key={index} 
              className="flex gap-3 items-start p-4 bg-green-50 rounded-lg border border-green-100"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-base text-gray-700 leading-relaxed flex-1">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
