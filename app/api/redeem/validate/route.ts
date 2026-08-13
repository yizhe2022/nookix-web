import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

function formatBenefitLabel(months: number) {
  if (months >= 1200) return 'Lifetime'
  if (months === 12) return '12 months'
  if (months % 12 === 0) return `${months / 12} ${months / 12 === 1 ? 'year' : 'years'}`
  return `${months} ${months === 1 ? 'month' : 'months'}`
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const code = String(body?.code || '').trim()

  const { data, error } = await supabase.rpc('validate_redeem_code', {
    input_code: code,
    input_user_id: user.id,
  })

  if (error) {
    console.error('[redeem.validate] RPC failed:', error)
    return NextResponse.json({ error: 'Unable to validate redeem code' }, { status: 500 })
  }

  const result = Array.isArray(data) ? data[0] : data

  if (!result?.valid) {
    const accountAlreadyRedeemed = result?.reason === 'This account has already redeemed a code'
    const errorMessage = accountAlreadyRedeemed
      ? 'This account has already redeemed a code.'
      : result?.reason === 'Redeem code not found'
        ? 'The redeem code is incorrect or expired.'
        : result?.reason || 'Invalid redeem code'

    return NextResponse.json({
      valid: false,
      error: errorMessage,
      benefitMonths: result?.benefit_months ?? null,
      codeStatus: result?.code_status ?? null,
      redeemedByEmail: result?.redeemed_by_email ?? null,
      redeemedAt: result?.redeemed_at ?? null,
      accountAlreadyRedeemed,
    })
  }

  return NextResponse.json({
    valid: true,
    benefitMonths: result.benefit_months,
    benefitLabel: formatBenefitLabel(result.benefit_months),
    estimatedExpiresAt: result.estimated_expires_at,
    currentExpiresAt: result.current_expires_at,
  })
}