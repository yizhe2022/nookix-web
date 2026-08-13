'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Gift, Loader2, PartyPopper, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RedeemState = 'idle' | 'validating' | 'valid' | 'redeeming' | 'success' | 'error'

interface ValidationResult {
  benefitMonths: number
  benefitLabel: string
  estimatedExpiresAt: string
  currentExpiresAt: string | null
}

interface RedeemErrorDetail {
  codeStatus?: string | null
  redeemedByEmail?: string | null
  redeemedAt?: string | null
  accountAlreadyRedeemed?: boolean
}

interface RedeemSuccess {
  benefitMonths: number
  benefitLabel: string
  newExpiresAt: string
}

interface RedeemCodeClientProps {
  userEmail: string
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

function formatDate(value: string | null | undefined, benefitMonths?: number) {
  if (benefitMonths && benefitMonths >= 1200) return 'Lifetime'
  if (!value) return 'Not active yet'
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}
function ConfettiBurst() {
  const pieces = Array.from({ length: 28 })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {pieces.map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full animate-[redeem-confetti_900ms_ease-out_forwards]"
          style={{
            backgroundColor: ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'][index % 5],
            transform: `rotate(${index * 13}deg) translateY(-8px)`,
            ['--tx' as string]: `${Math.cos(index) * (90 + (index % 5) * 22)}px`,
            ['--ty' as string]: `${Math.sin(index) * (70 + (index % 4) * 18)}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function RedeemCodeClient({ userEmail }: RedeemCodeClientProps) {
  const [code, setCode] = useState('')
  const [state, setState] = useState<RedeemState>('idle')
  const [message, setMessage] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [success, setSuccess] = useState<RedeemSuccess | null>(null)
  const [errorDetail, setErrorDetail] = useState<RedeemErrorDetail | null>(null)

  const normalizedCode = useMemo(() => code.trim().toUpperCase(), [code])
  const isBusy = state === 'validating' || state === 'redeeming'
  const canValidate = normalizedCode.length > 0 && !isBusy

  const validateCode = async () => {
    if (!canValidate) return

    setState('validating')
    setMessage('')
    setValidation(null)
    setSuccess(null)
    setErrorDetail(null)

    try {
      const response = await fetch('/api/redeem/validate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code: normalizedCode}),
      })
      const result = await response.json()

      if (!response.ok || !result.valid) {
        const isRedeemed = result.codeStatus === 'redeemed'
        const accountAlreadyRedeemed = result.accountAlreadyRedeemed === true
        setState('error')
        setMessage(accountAlreadyRedeemed ? 'This account has already used a redeem code. You can only redeem one code per account.' : (isRedeemed ? 'This code has already been redeemed.' : (result.error || 'The redeem code is incorrect or expired.')))
        setErrorDetail({
          codeStatus: result.codeStatus || null,
          redeemedByEmail: result.redeemedByEmail || null,
          redeemedAt: result.redeemedAt || null,
          accountAlreadyRedeemed,
        })
        return
      }

      setValidation(result)
      setState('valid')
    } catch (error: any) {
      setState('error')
      setMessage(error.message || 'Unable to validate redeem code')
    }
  }

  const redeemCode = async () => {
    if (!validation || isBusy) return

    setState('redeeming')
    setMessage('')

    try {
      const response = await fetch('/api/redeem/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code: normalizedCode}),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        setState('error')
        setMessage(result.error || 'Unable to redeem code')
        setErrorDetail({
          accountAlreadyRedeemed: result.accountAlreadyRedeemed === true,
        })
        return
      }

      setSuccess(result)
      setState('success')
    } catch (error: any) {
      setState('error')
      setMessage(error.message || 'Unable to redeem code')
    }
  }

  return (
    <div className="min-h-[calc(100vh-160px)] bg-[#FCFAF7] px-4 py-12 sm:px-6 lg:px-8">
      <style jsx global>{`
        @keyframes redeem-confetti {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.2); }
        }
      `}</style>

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100">
            <Gift className="mr-1 h-3.5 w-3.5" /> <span suppressHydrationWarning>Special Offer</span>
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Redeem your code
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Enter your community code to unlock Nookix Premium membership time.
          </p>
        </div>

        <Card className="relative overflow-hidden border-gray-200 bg-white/90 shadow-sm rounded-[2rem]">
          {state === 'success' && <ConfettiBurst />}
          <CardHeader className="border-b border-gray-100 bg-gradient-to-br from-white to-blue-50/40">
            <CardTitle className="flex items-center gap-2 text-2xl text-gray-950">
              Redeem Code
            </CardTitle>
            <CardDescription>
              Signed in as {userEmail || 'your account'}. Codes can only be redeemed once.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="redeem-code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase())
                    if (state !== 'idle') {
                      setState('idle')
                      setMessage('')
                      setValidation(null)
                      setSuccess(null)
                      setErrorDetail(null)
                    }
                  }}
                  placeholder="ENTER-CODE-HERE"
                  disabled={isBusy || state === 'success'}
                  className="h-12 text-base uppercase tracking-[0.18em]"
                />
                <Button
                  onClick={validateCode}
                  disabled={!canValidate || state === 'success'}
                  className="h-12 bg-gray-950 px-6 text-white hover:bg-gray-800"
                >
                  {state === 'validating' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Check'}
                </Button>
              </div>
            </div>

            {state === 'error' && (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${errorDetail?.codeStatus === 'redeemed' || errorDetail?.accountAlreadyRedeemed ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-red-100 bg-red-50 text-red-700'}`}>
                {errorDetail?.codeStatus === 'redeemed' || errorDetail?.accountAlreadyRedeemed ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold">{errorDetail?.accountAlreadyRedeemed ? 'Failed to redeem.' : (errorDetail?.codeStatus === 'redeemed' ? 'This code has already been redeemed.' : 'Code unavailable')}</div>
                    {errorDetail?.codeStatus !== 'redeemed' && !errorDetail?.accountAlreadyRedeemed && <div className="text-sm">{message}</div>}
                  </div>
                  {errorDetail?.accountAlreadyRedeemed && (
                    <div className="rounded-xl bg-white/70 p-4 text-sm text-orange-900">
                      This account has already used a redeem code. You can only redeem one code per account.
                    </div>
                  )}
                  {errorDetail?.codeStatus === 'redeemed' && (
                    <div className="space-y-1 rounded-xl bg-white/70 p-4 text-sm text-orange-900">
                      <div>
                        <span className="font-medium">Redeemed by:</span> {errorDetail.redeemedByEmail ? maskEmail(errorDetail.redeemedByEmail) : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Redeemed at:</span> {formatDate(errorDetail.redeemedAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {validation && state !== 'success' && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="mb-4 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">This code is valid</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-gray-500">Included benefit</div>
                    <div className="mt-1 font-semibold text-gray-950">{validation.benefitLabel}</div>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-gray-500">Current membership expiry</div>
                    <div className="mt-1 font-semibold text-gray-950">{formatDate(validation.currentExpiresAt)}</div>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-gray-500">Estimated new expiry</div>
                    <div className="mt-1 font-semibold text-gray-950">{formatDate(validation.estimatedExpiresAt, validation.benefitMonths)}</div>
                  </div>
                </div>
                <Button
                  onClick={redeemCode}
                  disabled={state === 'redeeming'}
                  className="mt-5 h-12 w-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  {state === 'redeeming' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Redemption'}
                </Button>
              </div>
            )}

            {success && state === 'success' && (
              <div className="relative rounded-3xl border border-blue-100 bg-blue-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <PartyPopper className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-950">Redeemed successfully</h2>
                <p className="mt-2 text-gray-600">
                  {success.benefitLabel} has been added to your Nookix Premium membership.
                </p>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <div className="text-xs text-gray-500">Your new expiry date</div>
                  <div className="mt-1 text-lg font-semibold text-gray-950">{formatDate(success.newExpiresAt, success.benefitMonths)}</div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild className="bg-gray-950 text-white hover:bg-gray-800">
                    <Link href="/dashboard/profile">View Profile</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/for-you">Explore More Books</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}