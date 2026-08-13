'use client'

import type React from 'react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, ChevronLeft, Eye, EyeOff, Mail } from 'lucide-react'
import SocialAuthButtons from '@/components/auth/social-auth-buttons'
import { createClient } from '@/utils/supabase/client'

type AuthStep = 'choices' | 'email'
export type AuthFlowMode = 'dialog' | 'signin' | 'signup'

interface AuthFlowProps {
  onSuccess: () => void
  mode?: AuthFlowMode
  showBenefits?: boolean
  idPrefix?: string
  switchHref?: string
}

const benefits = [
  '100% free access to thousands of bestselling books',
  'Save your favorite summaries & audio deep dives',
  'Sync your reading progress across all devices',
]

const headings: Record<AuthFlowMode, string> = {
  dialog: 'Start your deep learning journey',
  signin: 'Welcome back',
  signup: 'Get started',
}

const subheadings: Record<AuthFlowMode, string> = {
  dialog: '',
  signin: 'Sign in to your account',
  signup: 'Create your account',
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isInvalidCredentials = (message: string) => message.includes('Invalid login credentials')
const isExistingAccount = (message: string) => {
  return message.includes('already registered') || message.includes('already exists') || message.includes('User already registered')
}

async function assignRandomAvatar(userId: string) {
  try {
    await fetch('/api/assign-avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
  } catch {
    // Account creation must not depend on optional profile decoration.
  }
}

async function sendWelcomeEmail(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  if (!user.email) return

  try {
    await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name,
      }),
    })
  } catch {
    // Welcome email is non-blocking.
  }
}

function TermsNotice() {
  return (
    <p className="text-center text-xs leading-relaxed text-gray-500">
      By signing up, you accept our{' '}
      <Link href="/terms-of-service" className="font-medium text-blue-600 hover:text-blue-500">
        Terms
      </Link>{' '}
      &{' '}
      <Link href="/privacy-policy" className="font-medium text-blue-600 hover:text-blue-500">
        Privacy Policy
      </Link>
      .
    </p>
  )
}

function AuthSwitch({ mode, href }: { mode: 'signin' | 'signup'; href: string }) {
  return (
    <p className="text-center text-sm text-gray-600">
      {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
      <Link href={href} className="font-semibold text-blue-600 hover:text-blue-500">
        {mode === 'signin' ? 'Sign up' : 'Sign in'}
      </Link>
    </p>
  )
}

export default function AuthFlow({
  onSuccess,
  mode = 'dialog',
  showBenefits = true,
  idPrefix = 'auth',
  switchHref,
}: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('choices')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const showInlineEmailForm = mode === 'signin'

  const changeStep = (nextStep: AuthStep) => {
    setStep(nextStep)
    setError(null)
    setNotice(null)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(previous => ({ ...previous, [event.target.name]: event.target.value }))
    if (error) setError(null)
    if (notice) setNotice(null)
  }

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword(formData)

      if (!signInError) {
        onSuccess()
        return
      }

      if (!isInvalidCredentials(signInError.message || '')) throw signInError

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        ...formData,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { display_name: formData.email.split('@')[0] },
        },
      })

      const identities = signUpData.user?.identities ?? []
      if (signUpError || identities.length === 0) {
        const signUpMessage = signUpError?.message || ''
        if (!signUpError || isExistingAccount(signUpMessage)) {
          setError('This email already has an account. Check your password or reset it below.')
          return
        }
        throw signUpError
      }

      if (signUpData.user) {
        void assignRandomAvatar(signUpData.user.id)
        void sendWelcomeEmail(signUpData.user)
      }

      const { error: retrySignInError } = await supabase.auth.signInWithPassword(formData)
      if (retrySignInError) {
        if ((retrySignInError.message || '').includes('Email not confirmed')) {
          setNotice('Account created. Please check your email to finish verification.')
          return
        }
        throw retrySignInError
      }

      onSuccess()
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : ''
      if (message.includes('Email not confirmed')) {
        setNotice('Please check your email to finish verification.')
      } else if (message.includes('fetch')) {
        setError('Network error. Please check your internet connection.')
      } else if (message.includes('timeout')) {
        setError('Connection timeout. Please try again.')
      } else {
        setError(message || 'Authentication failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const emailForm = (
    <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
      <Input
        id={`${idPrefix}-email`}
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleInputChange}
        required
        autoFocus={!showInlineEmailForm}
        className="h-12"
      />

      <div className="relative">
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder={mode === 'signin' ? 'Password' : 'Password (min 8 characters)'}
          value={formData.password}
          onChange={handleInputChange}
          required
          className="h-12 pr-10"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(previous => !previous)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {notice && <p className="rounded-xl bg-blue-50 px-3 py-2 text-center text-sm text-blue-700">{notice}</p>}
      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <Button type="submit" className="h-12 w-full" disabled={isLoading}>
        {isLoading ? 'Continuing...' : mode === 'signin' ? 'Sign in' : 'Continue'}
      </Button>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className={mode === 'dialog' ? 'flex flex-col items-center text-center' : 'space-y-1.5'}>
        {mode === 'dialog' && (
          <div className="mb-4 flex items-center gap-2.5">
            <div className="relative h-12 w-12">
              <Image src="/nookix-logo.webp?v=5" alt="Nookix" fill className="object-contain" sizes="48px" priority />
            </div>
            <span className="text-[2rem] font-extrabold text-gray-900 font-[family-name:var(--font-nunito)]">Nookix</span>
          </div>
        )}
        <h1 className={mode === 'dialog' ? 'text-xl font-semibold tracking-tight text-gray-600' : 'text-2xl font-semibold text-gray-900'}>
          {headings[mode]}
        </h1>
        {mode !== 'dialog' && subheadings[mode] && (
          <p className="text-sm text-gray-600">{subheadings[mode]}</p>
        )}
      </div>

      {showInlineEmailForm ? (
        <>
          <SocialAuthButtons mode="signin" preserveSavedRedirect compactLabels onSuccess={onSuccess} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#fafbfc] px-2 text-gray-500">Or continue with email</span></div>
          </div>
          {emailForm}
          <div className="flex items-center justify-between gap-4 text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot password?
            </Link>
            {switchHref && (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href={switchHref} className="font-semibold text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            )}
          </div>
          <TermsNotice />
        </>
      ) : step === 'choices' ? (
        <>
          {showBenefits && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              {benefits.map(benefit => (
                <div key={benefit} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <SocialAuthButtons mode="signup" preserveSavedRedirect compactLabels onSuccess={onSuccess} />
            <Button type="button" variant="outline" className="h-12 w-full justify-center border-gray-300 bg-white font-medium hover:bg-gray-50" onClick={() => changeStep('email')}>
              <Mail className="mr-3 h-6 w-6 text-slate-700" />
              Continue with Email
            </Button>
          </div>

          {mode === 'signup' && switchHref && <AuthSwitch mode="signup" href={switchHref} />}
          <TermsNotice />
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeStep('choices')} aria-label="Back to auth options">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Continue with email</h2>
              <p className="text-sm text-gray-500">We’ll sign you in or create your account automatically.</p>
            </div>
          </div>
          {emailForm}
          {mode === 'signup' && switchHref && <AuthSwitch mode="signup" href={switchHref} />}
          <TermsNotice />
        </>
      )}
    </div>
  )
}