import { Suspense } from 'react'
import type { Metadata } from 'next'
import AuthLayout from '@/components/auth/auth-layout'
import AuthPageForm from '@/components/auth/auth-page-form'

export const metadata: Metadata = {
  title: 'Create Your Nookix Account | Start for Free',
  description: 'Create your Nookix account with Google, Facebook, or email and start your deep learning journey.',
}

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthPageForm mode="signup" />
      </Suspense>
    </AuthLayout>
  )
}