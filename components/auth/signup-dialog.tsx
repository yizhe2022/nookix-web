'use client'

import AuthDialog from '@/components/auth/auth-dialog'

interface SignupDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSwitchToLogin?: () => void
}

export default function SignupDialog({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: SignupDialogProps) {
  return (
    <AuthDialog
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      initialMode="signup"
      onSwitchToSignin={onSwitchToLogin}
    />
  )
}