'use client'

import { useState } from 'react'
import { ArrowRight, LogIn, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import LoginDialog from '@/components/auth/login-dialog'
import { useRouter } from 'next/navigation'
import RichText from '@/components/ui/rich-text'

interface SummaryPreviewSectionProps {
  summaryPreview: string
  bookSlug: string
}

const COLLAPSED_WORD_LIMIT = 300

const toPlainText = (content: string) => {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const getPreviewWords = (content: string) => toPlainText(content).split(/\s+/).filter(Boolean)

const shouldCollapsePreview = (content: string) => {
  return getPreviewWords(content).length > COLLAPSED_WORD_LIMIT
}

const getCollapsedParagraphs = (content: string) => {
  const paragraphs = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)>/gi, '$&\n\n')
    .split(/\n\s*\n/)
    .map(toPlainText)
    .filter(Boolean)

  let remainingWords = COLLAPSED_WORD_LIMIT

  return paragraphs.reduce<string[]>((preview, paragraph) => {
    if (remainingWords === 0) return preview

    const words = paragraph.split(/\s+/).filter(Boolean)
    const visibleWords = words.slice(0, remainingWords)

    if (visibleWords.length > 0) {
      preview.push(visibleWords.join(' '))
      remainingWords -= visibleWords.length
    }

    return preview
  }, [])
}

export default function SummaryPreviewSection({ summaryPreview, bookSlug }: SummaryPreviewSectionProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isLoggedIn = !!user
  const shouldCollapse = shouldCollapsePreview(summaryPreview)
  const isCollapsed = shouldCollapse && !isExpanded
  const collapsedParagraphs = getCollapsedParagraphs(summaryPreview)

  const handleLoginSuccess = () => {
    setShowLoginDialog(false)
    router.push(`/dashboard/book/${bookSlug}`)
  }

  const handleCTAClick = () => {
    if (isLoggedIn) {
      router.push(`/dashboard/book/${bookSlug}`)
    } else {
      localStorage.setItem('redirectAfterLogin', `/dashboard/book/${bookSlug}`)
      setShowLoginDialog(true)
    }
  }

  return (
    <>
      <div id="summary-preview" className="mb-0 md:mb-6 md:px-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight mb-4 md:mb-6">
          Summary Preview
        </h2>

        <div className="relative">
          {isCollapsed && (
            <div className="prose prose-base max-w-none text-gray-700 leading-relaxed">
              {collapsedParagraphs.map((paragraph, index) => {
                const isLastParagraph = index === collapsedParagraphs.length - 1

                return (
                  <p key={index}>
                    {paragraph}
                    {isLastParagraph && (
                      <>
                        {' '}
                        <button
                          type="button"
                          className="inline-flex items-center align-baseline text-sm font-semibold text-blue-600 hover:text-blue-700"
                          onClick={() => setIsExpanded(true)}
                        >
                          … Read more
                          <ChevronDown className="ml-1 h-4 w-4 self-center" />
                        </button>
                      </>
                    )}
                  </p>
                )
              })}
            </div>
          )}

          <div className={isCollapsed ? 'hidden' : undefined}>
            <RichText content={summaryPreview} />
          </div>

          {isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          )}
        </div>

        {shouldCollapse && isExpanded && (
          <div className="mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-sm font-semibold text-blue-600 hover:bg-transparent hover:text-blue-700"
              onClick={() => setIsExpanded(false)}
            >
              Show less
              <ChevronUp className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center justify-center pt-4">
            <Button
              onClick={handleCTAClick}
              variant="outline"
              className="gap-2 text-sm font-medium"
            >
              {isLoggedIn ? (
                <>
                  Continue in Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Login to unlock full summary
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}