'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthFlow, { type AuthFlowMode } from '@/components/auth/auth-flow'
import { createClient } from '@/utils/supabase/client'

interface AuthPageFormProps {
  mode: Extract<AuthFlowMode, 'signin' | 'signup'>
}

const getSafePath = (path: string | null | undefined) => {
  return path?.startsWith('/') && !path.startsWith('//') ? path : null
}

export default function AuthPageForm({ mode }: AuthPageFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = getSafePath(searchParams.get('next'))

  const redirectPath = useMemo(() => {
    if (nextPath) return nextPath
    if (typeof window === 'undefined') return '/dashboard/for-you'

    return getSafePath(localStorage.getItem('redirectAfterLogin')) || '/dashboard/for-you'
  }, [nextPath])

  const switchHref = useMemo(() => {
    const destination = mode === 'signin' ? '/auth/signup' : '/auth/signin'
    return nextPath ? `${destination}?next=${encodeURIComponent(nextPath)}` : destination
  }, [mode, nextPath])

  const completeAuth = useCallback(() => {
    localStorage.removeItem('redirectAfterLogin')
    router.replace(redirectPath)
    router.refresh()
  }, [redirectPath, router])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) completeAuth()
    })
  }, [completeAuth])

  return (
    <AuthFlow
      mode={mode}
      onSuccess={completeAuth}
      showBenefits={false}
      idPrefix={`auth-${mode}-page`}
      switchHref={switchHref}
    />
  )
}