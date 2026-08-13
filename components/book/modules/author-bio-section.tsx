import { Card, CardContent, CardHeader } from '@/components/ui/card'
import RichText from '@/components/ui/rich-text'

interface AuthorBioSectionProps {
  authorName: string
  bio?: string
  photoUrl?: string
}

export default function AuthorBioSection({ 
  authorName, 
  bio, 
  photoUrl 
}: AuthorBioSectionProps) {
  if (!bio) return null

  return (
    <Card id="about-author" className="mb-12 md:mb-16 shadow-none border-0 bg-transparent rounded-none md:rounded-lg">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
          About the Author
        </h2>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-0 md:p-6 md:pt-0 md:pb-8">
        <RichText
          content={bio}
          className="prose max-w-none text-gray-700 leading-relaxed"
        />
      </CardContent>
    </Card>
  )
}
