'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import AuthFlow from '@/components/auth/auth-flow'

type AuthMode = 'signin' | 'signup'

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialMode?: AuthMode
  onSwitchToSignin?: () => void
  onSwitchToSignup?: () => void
}

export default function AuthDialog({ isOpen, onClose, onSuccess }: AuthDialogProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleSuccess = () => {
    onSuccess()
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Close auth dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <AuthFlow onSuccess={handleSuccess} showBenefits idPrefix="auth-dialog" />
      </div>
    </div>
  )
}