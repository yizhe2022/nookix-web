'use client'

import AuthDialog from '@/components/auth/auth-dialog'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSwitchToSignup?: () => void
}

export default function LoginDialog({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToSignup,
}: LoginDialogProps) {
  return (
    <AuthDialog
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      initialMode="signin"
      onSwitchToSignup={onSwitchToSignup}
    />
  )
}